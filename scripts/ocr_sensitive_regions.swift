import AppKit
import Foundation
import Vision

func imageOrientation(_ image: NSImage) -> CGImagePropertyOrientation {
    return .up
}

var output: [[String: Any]] = []

for rawPath in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: rawPath)
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        continue
    }

    let textRequest = VNRecognizeTextRequest()
    textRequest.recognitionLevel = .accurate
    textRequest.usesLanguageCorrection = false
    textRequest.recognitionLanguages = ["zh-Hans", "en-US"]

    let barcodeRequest = VNDetectBarcodesRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: imageOrientation(image))
    do {
        try handler.perform([textRequest, barcodeRequest])
    } catch {
        continue
    }

    var observations: [[String: Any]] = []
    for observation in textRequest.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else { continue }
        let box = observation.boundingBox
        observations.append([
            "kind": "text",
            "text": candidate.string,
            "confidence": candidate.confidence,
            "x": box.origin.x,
            "y": box.origin.y,
            "width": box.size.width,
            "height": box.size.height,
        ])
    }
    for observation in barcodeRequest.results ?? [] {
        let box = observation.boundingBox
        observations.append([
            "kind": "barcode",
            "text": observation.payloadStringValue ?? "",
            "confidence": observation.confidence,
            "x": box.origin.x,
            "y": box.origin.y,
            "width": box.size.width,
            "height": box.size.height,
        ])
    }
    output.append([
        "path": rawPath,
        "pixelWidth": cgImage.width,
        "pixelHeight": cgImage.height,
        "observations": observations,
    ])
}

let data = try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted])
FileHandle.standardOutput.write(data)
