import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { timeInRange } from '@/lib/cgm-import';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Insights { summary: string; trends: string[]; questions: string[] }

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

export const buildClinicalReport = async (days: number, includeAi: boolean) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in again.');
  const sinceDate = subDays(new Date(), days - 1);
  const since = format(sinceDate, 'yyyy-MM-dd');

  const [readingsQ, cgmQ, medsQ, foodQ, statsQ, aiRes] = await Promise.all([
    supabase.from('blood_sugar_readings').select('date, hba1c, fasting, post_prandial')
      .eq('user_id', user.id).gte('date', since).order('date', { ascending: false }),
    db.from('cgm_readings').select('value_mgdl').gte('recorded_at', sinceDate.toISOString()).limit(10000),
    supabase.from('medicine_logs').select('medicine_time, taken_at').eq('user_id', user.id).gte('taken_at', sinceDate.toISOString()),
    supabase.from('food_logs').select('date, calories, proteins, carbs, fats').eq('user_id', user.id).gte('date', since),
    supabase.from('user_stats').select('diabetes_type, age, gender, weight_kg, height_cm, blood_sugar_target_min, blood_sugar_target_max, a1c_target')
      .eq('user_id', user.id).maybeSingle(),
    includeAi ? supabase.functions.invoke('glucose-insights') : Promise.resolve({ data: null, error: null }),
  ]);

  const readings = readingsQ.data ?? [];
  const cgm = (cgmQ.data ?? []) as { value_mgdl: number }[];
  const meds = medsQ.data ?? [];
  const food = foodQ.data ?? [];
  const stats = statsQ.data;
  const ai = (aiRes.error ? null : aiRes.data) as Insights | null;

  const tMin = stats?.blood_sugar_target_min ?? 80;
  const tMax = stats?.blood_sugar_target_max ?? 130;
  const fasting = readings.map((r) => r.fasting).filter((v): v is number => v != null);
  const post = readings.map((r) => r.post_prandial).filter((v): v is number => v != null);
  const a1c = readings.filter((r) => r.hba1c != null);

  // Adherence: 3 slots per day
  const expected = days * 3;
  const takenDoses = new Set(meds.map((m) => `${format(new Date(m.taken_at), 'yyyy-MM-dd')}-${m.medicine_time}`)).size;
  const adherence = Math.min(100, Math.round((takenDoses / expected) * 100));

  const foodDays = new Set(food.map((f) => f.date)).size || 1;
  const sum = (k: 'proteins' | 'carbs' | 'fats') => food.reduce((a, f) => a + Number(f[k] ?? 0), 0);
  const kcal = food.reduce((a, f) => a + (parseFloat(String(f.calories ?? '0')) || 0), 0);

  // ---- PDF ----
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = M;
  const accent: [number, number, number] = [124, 92, 180];

  doc.setFillColor(...accent); doc.rect(0, 0, W, 70, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text('Diabetes Clinical Summary', M, 35);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${format(sinceDate, 'd MMM yyyy')} – ${format(new Date(), 'd MMM yyyy')}  ·  ${days} days`, M, 54);
  doc.text(`Generated ${format(new Date(), 'd MMM yyyy HH:mm')}`, W - M, 54, { align: 'right' });
  y = 95;
  doc.setTextColor(30);

  const heading = (t: string) => {
    if (y > 760) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...accent);
    doc.text(t, M, y); y += 6;
    doc.setDrawColor(...accent); doc.line(M, y, W - M, y); y += 14;
    doc.setTextColor(30); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  };
  const para = (t: string) => {
    const lines = doc.splitTextToSize(t, W - 2 * M);
    if (y + lines.length * 13 > 800) { doc.addPage(); y = M; }
    doc.text(lines, M, y); y += lines.length * 13 + 4;
  };
  const table = (head: string[], body: (string | number)[][]) => {
    autoTable(doc, {
      startY: y, head: [head], body, margin: { left: M, right: M },
      styles: { fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: accent },
      alternateRowStyles: { fillColor: [246, 243, 250] },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 18;
  };

  heading('Patient');
  table(['Email', 'Diabetes type', 'Age', 'Sex', 'Weight', 'Height'], [[
    user.email ?? '—', stats?.diabetes_type ?? '—', stats?.age ?? '—', stats?.gender ?? '—',
    stats?.weight_kg ? `${stats.weight_kg} kg` : '—', stats?.height_cm ? `${stats.height_cm} cm` : '—',
  ]]);

  heading('Glucose overview');
  table(['Measure', 'Value', 'Target'], [
    ['Latest HbA1c', a1c[0] ? `${a1c[0].hba1c}% (${format(new Date(a1c[0].date), 'd MMM yyyy')})` : '—', stats?.a1c_target ? `< ${stats.a1c_target}%` : '—'],
    ['Average fasting', fasting.length ? `${avg(fasting)} mg/dL (${fasting.length} readings)` : '—', `${tMin}–${tMax} mg/dL`],
    ['Average post-meal', post.length ? `${avg(post)} mg/dL (${post.length} readings)` : '—', '< 180 mg/dL'],
    ['Fasting range', fasting.length ? `${Math.min(...fasting)}–${Math.max(...fasting)} mg/dL` : '—', ''],
    ['Low readings (< 70)', [...fasting, ...post].filter((v) => v < 70).length, ''],
  ]);

  if (cgm.length) {
    const t = timeInRange(cgm);
    heading('CGM time in range');
    table(['Readings', 'Average', 'Below 70', '70–180', 'Above 180'], [[
      cgm.length, `${avg(cgm.map((c) => c.value_mgdl))} mg/dL`, `${t.low}%`, `${t.inRange}%`, `${t.high}%`,
    ]]);
  }

  heading('Medication adherence');
  para(`${takenDoses} of ${expected} scheduled doses logged as taken (${adherence}%).`);

  heading('Nutrition (daily average on logged days)');
  table(['Days logged', 'Calories', 'Carbs', 'Protein', 'Fat'], [[
    new Set(food.map((f) => f.date)).size, `${Math.round(kcal / foodDays)} kcal`,
    `${Math.round(sum('carbs') / foodDays)} g`, `${Math.round(sum('proteins') / foodDays)} g`, `${Math.round(sum('fats') / foodDays)} g`,
  ]]);

  if (ai) {
    heading('AI summary');
    para(ai.summary);
    ai.trends?.forEach((t) => para(`•  ${t}`));
    if (ai.questions?.length) {
      y += 4; doc.setFont('helvetica', 'bold'); para('Questions to discuss'); doc.setFont('helvetica', 'normal');
      ai.questions.forEach((q, i) => para(`${i + 1}.  ${q}`));
    }
  }

  if (readings.length) {
    heading('Reading log');
    table(['Date', 'Fasting', 'Post-meal', 'HbA1c'], readings.map((r) => [
      format(new Date(r.date), 'EEE d MMM yyyy'), r.fasting ?? '', r.post_prandial ?? '', r.hba1c != null ? `${r.hba1c}%` : '',
    ]));
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(130);
    doc.text('Patient-recorded data from Diabeticks. AI content is not medical advice.', M, 825);
    doc.text(`Page ${i} of ${pages}`, W - M, 825, { align: 'right' });
  }

  doc.save(`diabetes-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  return { aiFailed: includeAi && !ai };
};
