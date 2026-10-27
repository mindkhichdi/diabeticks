import Foundation
import PDFKit
import Supabase
import UIKit

/// Calls the app's AI edge functions (same ones the web app uses).
enum AIService {
    struct Failure: LocalizedError {
        let errorDescription: String?
    }

    static func insights() async throws -> Insights {
        do {
            return try await supabase.functions.invoke("glucose-insights")
        } catch {
            throw friendly(error, fallback: "Couldn't generate insights right now.")
        }
    }

    static func analyzeFood(_ image: UIImage) async throws -> FoodAnalysis {
        guard let jpeg = image.downscaled(maxSide: 1280).jpegData(compressionQuality: 0.7) else {
            throw Failure(errorDescription: "Couldn't read that photo.")
        }
        struct Body: Encodable { let image: String }
        let body = Body(image: "data:image/jpeg;base64," + jpeg.base64EncodedString())
        do {
            return try await supabase.functions.invoke("analyze-food-image", options: FunctionInvokeOptions(body: body))
        } catch {
            throw friendly(error, fallback: "Couldn't read that photo right now.")
        }
    }

    /// Reads a prescription (photo or PDF pages) and returns the medicines it lists.
    static func scanPrescription(_ images: [UIImage]) async throws -> [ScannedMedicine] {
        let encoded = images.prefix(4).compactMap {
            $0.downscaled(maxSide: 1800).jpegData(compressionQuality: 0.75)
                .map { "data:image/jpeg;base64," + $0.base64EncodedString() }
        }
        guard !encoded.isEmpty else { throw Failure(errorDescription: "Couldn't read that file.") }
        struct Body: Encodable { let images: [String] }
        do {
            let result: ScanResult = try await supabase.functions.invoke(
                "scan-prescription", options: FunctionInvokeOptions(body: Body(images: encoded)))
            return result.medicines
        } catch {
            throw friendly(error, fallback: "Couldn't read that prescription right now.")
        }
    }

    /// The functions reply `{ "error": "message" }` on failure; surface that message.
    private static func friendly(_ error: Error, fallback: String) -> Failure {
        if case let FunctionsError.httpError(_, data) = error,
           let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let message = obj["error"] as? String {
            return Failure(errorDescription: message)
        }
        return Failure(errorDescription: fallback)
    }
}

extension UIImage {
    /// Renders up to `maxPages` pages of a PDF so they can be scanned like photos.
    static func pages(ofPDF data: Data, maxPages: Int = 3) -> [UIImage] {
        guard let doc = PDFDocument(data: data) else { return [] }
        return (0..<min(doc.pageCount, maxPages)).compactMap { i in
            guard let page = doc.page(at: i) else { return nil }
            let box = page.bounds(for: .mediaBox)
            let scale = 1600 / max(box.width, box.height)
            let size = CGSize(width: box.width * scale, height: box.height * scale)
            return UIGraphicsImageRenderer(size: size).image { ctx in
                UIColor.white.setFill(); ctx.fill(CGRect(origin: .zero, size: size))
                ctx.cgContext.translateBy(x: 0, y: size.height)
                ctx.cgContext.scaleBy(x: scale, y: -scale)
                page.draw(with: .mediaBox, to: ctx.cgContext)
            }
        }
    }

    func downscaled(maxSide: CGFloat) -> UIImage {
        let longest = max(size.width, size.height)
        guard longest > maxSide else { return self }
        let scale = maxSide / longest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: newSize, format: format).image { _ in
            draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}
