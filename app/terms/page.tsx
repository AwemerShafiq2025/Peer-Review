import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service & Privacy Policy — PeerReviewer",
  description: "Terms of Service and Privacy Policy for PeerReviewer by Albatross Technologies.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold text-text-primary">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  const lastUpdated = "June 5, 2026";

  return (
    <main className="min-h-screen bg-base">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Terms of Service &{" "}
            <span className="text-accent">Privacy Policy</span>
          </h1>
          <p className="mt-3 text-text-secondary">
            Last updated: {lastUpdated} · Albatross Technologies
          </p>
          <div className="mt-4 flex gap-3 text-sm">
            <a href="#terms" className="text-accent hover:underline underline-offset-2">
              Terms of Service
            </a>
            <span className="text-text-tertiary">·</span>
            <a href="#privacy" className="text-accent hover:underline underline-offset-2">
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="mb-10 rounded-xl border border-amber-400/20 bg-amber-500/5 p-5">
          <p className="text-sm font-semibold text-amber-300">Important Notice</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            PeerReviewer generates AI-powered reviews for guidance and rehearsal
            purposes only. Reviews do <strong className="text-text-primary">not</strong>{" "}
            constitute formal peer review and carry no academic weight. They
            should not be cited or used as evidence of peer review by any
            journal or institution.
          </p>
        </div>

        {/* ── TERMS OF SERVICE ── */}
        <div id="terms" className="card mb-12 p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold">Terms of Service</h2>

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using PeerReviewer ("the Service"), operated by
              Albatross Technologies, you agree to be bound by these Terms of
              Service. If you do not agree, please do not use the Service.
            </p>
            <p>
              We reserve the right to update these terms at any time. Continued
              use of the Service after changes constitutes your acceptance of
              the revised terms.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              PeerReviewer is an AI-powered tool that generates simulated peer
              review feedback for scientific manuscripts. The Service uses large
              language models served via NVIDIA NIM to produce structured
              reviewer reports and an editorial decision calibrated to a target
              journal quartile (Q1–Q4).
            </p>
            <p>
              The Service is intended as a pre-submission rehearsal tool to help
              authors identify weaknesses in their manuscripts before formal
              journal submission.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>
              You must be at least 13 years old to use this Service. By
              registering, you confirm that you meet this requirement and that
              the information you provide is accurate and complete.
            </p>
          </Section>

          <Section title="4. User Accounts">
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials. You agree to notify us immediately of any
              unauthorized use of your account. Albatross Technologies is not
              liable for any loss resulting from unauthorized account access.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these terms or engage in abusive behavior toward the Service.
            </p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Use the Service to generate fraudulent peer reviews for actual journal submissions</li>
              <li>Misrepresent AI-generated reviews as genuine academic peer review</li>
              <li>Attempt to circumvent rate limits or abuse the API</li>
              <li>Upload content that violates intellectual property rights or applicable law</li>
              <li>Use automated scripts to submit large volumes of manuscripts</li>
              <li>Attempt to reverse-engineer or extract the underlying AI models</li>
            </ul>
          </Section>

          <Section title="6. AI-Generated Content Disclaimer">
            <p>
              All reviews generated by PeerReviewer are produced by artificial
              intelligence models and are provided "as is" for informational
              purposes only. The reviews:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>May contain factual errors, hallucinations, or inaccuracies</li>
              <li>Do not represent the views of Albatross Technologies</li>
              <li>Are not a substitute for expert human peer review</li>
              <li>Should not be cited in any academic or professional context</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              You retain full ownership of any manuscripts or text you submit
              to the Service. By submitting content, you grant Albatross
              Technologies a limited, non-exclusive license to process your
              content solely for the purpose of generating reviews.
            </p>
            <p>
              The PeerReviewer platform, including its code, design, and
              branding, is the intellectual property of Albatross Technologies.
              Unauthorized copying or reproduction is prohibited.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Albatross Technologies
              shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of the Service,
              including but not limited to: reliance on AI-generated reviews,
              academic or professional decisions made based on Service output,
              or data loss.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              We may suspend or terminate your access to the Service at any
              time, with or without cause. You may delete your account at any
              time through your profile settings. Upon termination, your review
              history will be permanently deleted.
            </p>
          </Section>

          <Section title="10. Governing Law">
            <p>
              These terms are governed by applicable law. Any disputes shall be
              resolved through good-faith negotiation before any formal
              proceedings.
            </p>
          </Section>
        </div>

        {/* ── PRIVACY POLICY ── */}
        <div id="privacy" className="card p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold">Privacy Policy</h2>

          <Section title="1. Information We Collect">
            <p>
              <strong className="text-text-primary">Account Information:</strong>{" "}
              When you register, we collect your name, email address, and a
              securely hashed password. We never store your password in plain
              text.
            </p>
            <p>
              <strong className="text-text-primary">Manuscript Text:</strong>{" "}
              When you submit a paper for review, the extracted text is sent to
              NVIDIA NIM for processing. If you upload a PDF, the text
              extraction happens entirely in your browser — the PDF file itself
              never leaves your device.
            </p>
            <p>
              <strong className="text-text-primary">Review History:</strong>{" "}
              Completed reviews are saved to your account in our Neon
              PostgreSQL database, including the paper title, quartile, verdict,
              scores, and full review content.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>To authenticate you and maintain your account</li>
              <li>To generate AI peer reviews of your submitted manuscripts</li>
              <li>To save and display your review history</li>
              <li>To send verification emails (via Resend)</li>
              <li>To improve the Service and diagnose technical issues</li>
            </ul>
            <p>
              We do <strong className="text-text-primary">not</strong> sell your
              personal information to third parties. We do not use your
              manuscript content for training AI models.
            </p>
          </Section>

          <Section title="3. Third-Party Services">
            <p>We use the following third-party services:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <strong className="text-text-primary">NVIDIA NIM</strong> —
                Processes manuscript text to generate reviews. Subject to{" "}
                <a
                  href="https://www.nvidia.com/en-us/about-nvidia/privacy-policy/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline underline-offset-2"
                >
                  NVIDIA's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-text-primary">Neon PostgreSQL</strong>{" "}
                — Stores account and review data securely.
              </li>
              <li>
                <strong className="text-text-primary">Vercel</strong> — Hosts
                the application. Subject to{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline underline-offset-2"
                >
                  Vercel's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-text-primary">Resend</strong> — Sends
                verification emails.
              </li>
            </ul>
          </Section>

          <Section title="4. Data Retention">
            <p>
              Your account and review history are retained as long as your
              account is active. You may delete individual reviews from your
              history at any time. To request full account deletion, contact us
              and we will permanently remove all your data within 30 days.
            </p>
          </Section>

          <Section title="5. Security">
            <p>
              We implement industry-standard security measures including
              bcrypt password hashing, JWT-based authentication, and encrypted
              database connections. However, no system is completely secure —
              please use a strong, unique password for your account.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use a single session cookie to keep you logged in. We do not
              use tracking cookies or third-party advertising cookies.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate information via your profile page</li>
              <li>Delete your review history at any time</li>
              <li>Request full account and data deletion</li>
            </ul>
          </Section>

          <Section title="8. Contact">
            <p>
              For privacy concerns or data requests, please contact Albatross
              Technologies. We aim to respond to all requests within 7 business
              days.
            </p>
          </Section>
        </div>

        {/* Bottom nav */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-text-tertiary">
            Questions about these policies? Reach out to Albatross Technologies.
          </p>
          <div className="flex gap-3">
            <Link href="/" className="btn-outline !px-5 !py-2 text-sm">
              Back to Home
            </Link>
            <Link href="/register" className="btn-primary !px-5 !py-2 text-sm">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}