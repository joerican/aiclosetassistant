import SwiftUI
import PhotosUI

struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @Environment(AuthService.self) private var authService
    @State private var currentPage = 0

    var body: some View {
        TabView(selection: $currentPage) {
            // Page 1: Welcome
            WelcomePage()
                .tag(0)

            // Page 2: Photo Access
            PhotoAccessPage(onContinue: { currentPage = 2 })
                .tag(1)

            // Page 3: Sign In
            SignInPage(onComplete: {
                hasCompletedOnboarding = true
            })
                .tag(2)
        }
        .tabViewStyle(.page)
        .indexViewStyle(.page(backgroundDisplayMode: .always))
        .animation(.easeInOut, value: currentPage)
    }
}

// MARK: - Welcome Page

private struct WelcomePage: View {
    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "tshirt.fill")
                .font(.system(size: 80))
                .foregroundStyle(.blue)

            VStack(spacing: 16) {
                Text("Welcome to AI Closet")
                    .font(.largeTitle.bold())

                Text("Organize your wardrobe with AI-powered insights and never wonder what to wear again.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()

            VStack(spacing: 12) {
                FeatureRow(
                    icon: "camera.fill",
                    title: "Snap & Catalog",
                    description: "Take photos of your clothes"
                )

                FeatureRow(
                    icon: "sparkles",
                    title: "AI Analysis",
                    description: "Auto-detect colors, patterns & style"
                )

                FeatureRow(
                    icon: "shuffle",
                    title: "Smart Outfits",
                    description: "Get outfit suggestions that work"
                )
            }
            .padding(.horizontal)

            Spacer()

            Text("Swipe to continue")
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
    }
}

private struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.blue)
                .frame(width: 44)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Photo Access Page

private struct PhotoAccessPage: View {
    let onContinue: () -> Void
    @State private var permissionGranted = false
    @State private var permissionDenied = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 80))
                .foregroundStyle(.green)

            VStack(spacing: 16) {
                Text("Photo Access")
                    .font(.largeTitle.bold())

                Text("We need access to your photos to add clothing items to your closet. Your photos stay on your device.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()

            VStack(spacing: 16) {
                if permissionGranted {
                    Label("Access Granted", systemImage: "checkmark.circle.fill")
                        .font(.headline)
                        .foregroundStyle(.green)

                    Button("Continue") {
                        onContinue()
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                } else if permissionDenied {
                    Text("Photo access denied. You can enable it in Settings.")
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)

                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .buttonStyle(.bordered)

                    Button("Skip for Now") {
                        onContinue()
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                } else {
                    Button("Allow Photo Access") {
                        requestPhotoAccess()
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
            }

            Spacer()
        }
        .padding()
        .onAppear {
            checkPhotoPermission()
        }
    }

    private func checkPhotoPermission() {
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        switch status {
        case .authorized, .limited:
            permissionGranted = true
        case .denied, .restricted:
            permissionDenied = true
        default:
            break
        }
    }

    private func requestPhotoAccess() {
        PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
            DispatchQueue.main.async {
                switch status {
                case .authorized, .limited:
                    permissionGranted = true
                case .denied, .restricted:
                    permissionDenied = true
                default:
                    break
                }
            }
        }
    }
}

// MARK: - Sign In Page

private struct SignInPage: View {
    let onComplete: () -> Void
    @Environment(AuthService.self) private var authService

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(.orange)

            VStack(spacing: 16) {
                Text("Sign In")
                    .font(.largeTitle.bold())

                Text("Sign in with Apple for a secure, private experience. We never see your password.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()

            VStack(spacing: 16) {
                if authService.isAuthenticated {
                    VStack(spacing: 8) {
                        Label("Signed In", systemImage: "checkmark.circle.fill")
                            .font(.headline)
                            .foregroundStyle(.green)

                        if let name = authService.userName {
                            Text("Welcome, \(name)!")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Button("Get Started") {
                        onComplete()
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                } else {
                    SignInWithAppleButtonView()
                        .frame(height: 50)
                        .padding(.horizontal, 32)

                    Button("Skip for Now") {
                        onComplete()
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    .padding(.top, 8)

                    Text("You can sign in later in Settings")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding()
    }
}

// MARK: - Preview

#Preview {
    OnboardingView()
        .environment(AuthService())
}
