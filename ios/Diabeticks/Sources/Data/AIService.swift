import Foundation
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
