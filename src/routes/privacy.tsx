import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<main className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex-1 overflow-scroll">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
				{/* Header */}
				<div className="flex flex-col gap-6">
					<Link to="/">
						<Button variant="ghost">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Home
						</Button>
					</Link>
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<div className="p-3 rounded-lg bg-[#03045E]/10 dark:bg-[#0077B6]/20">
								<Shield className="w-6 h-6 text-[#03045E] dark:text-[#0077B6]" />
							</div>
							<h1 className="text-4xl font-bold text-slate-900 dark:text-white">
								Privacy Policy
							</h1>
						</div>
						<p className="text-slate-600 dark:text-slate-400">
							Last updated:{" "}
							{new Date().toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>
				</div>

				{/* Content */}
				<div className="bg-slate-50 dark:bg-slate-950 p-8 flex flex-col gap-8">
					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Introduction
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							Welcome to Proto Map ("we," "our," or "us"). We are committed to
							protecting your privacy and ensuring transparency about how we
							collect, use, and protect your information. This Privacy Policy
							explains our practices regarding data collection and usage when
							you use our service to create and manage mind maps and user flow
							diagrams.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Information We Collect
						</h2>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Authentication Information
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									When you sign in with Google, we receive basic profile
									information including your email address and name. This
									information is managed by Google OAuth and Supabase, our
									authentication provider. We do not store your Google password
									or have direct access to your Google account.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Project Data
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									We store the mind maps and user flow diagrams you create,
									including node data, connections, and any text content you
									provide. This data is stored securely in our database and is
									associated with your account.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Usage Information
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									We may collect basic usage information such as when you access
									the service and which features you use. This helps us improve
									our service.
								</p>
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							How We Use Your Information
						</h2>
						<ul className="list-disc list-inside flex flex-col gap-2 text-slate-700 dark:text-slate-300 leading-relaxed">
							<li>
								To provide and maintain our service, including storing and
								retrieving your mind maps
							</li>
							<li>To authenticate your identity and manage your account</li>
							<li>
								To process your requests for AI-generated mind maps and
								modifications
							</li>
							<li>To improve our service and develop new features</li>
							<li>To communicate with you about your account or our service</li>
						</ul>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Third-Party Services
						</h2>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									OpenAI API
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									When you request AI-generated mind maps or modifications, we
									send your prompts and project context to OpenAI's API.{" "}
									<strong>
										We do not control OpenAI's data practices, and your use of
										AI features is subject to OpenAI's privacy policy.
									</strong>{" "}
									We recommend reviewing{" "}
									<a
										href="https://openai.com/policies/privacy-policy"
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#03045E] dark:text-[#0077B6] hover:underline"
									>
										OpenAI's Privacy Policy
									</a>{" "}
									to understand how they handle data.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Supabase
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									We use Supabase for authentication and data storage. Your data
									is stored securely in Supabase's infrastructure. Please review{" "}
									<a
										href="https://supabase.com/privacy"
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#03045E] dark:text-[#0077B6] hover:underline"
									>
										Supabase's Privacy Policy
									</a>{" "}
									for information about their data practices.
								</p>
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Data Sharing
						</h2>
						<div className="flex flex-col gap-4">
							<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
								We do not sell, trade, or rent your personal information to
								third parties. We only share information as necessary to:
							</p>
							<ul className="list-disc list-inside flex flex-col gap-2 text-slate-700 dark:text-slate-300 leading-relaxed">
								<li>
									Provide our service (e.g., sending prompts to OpenAI for AI
									generation)
								</li>
								<li>
									Comply with legal obligations or respond to lawful requests
								</li>
								<li>Protect our rights, privacy, safety, or property</li>
							</ul>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Data Security
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							We implement appropriate technical and organizational measures to
							protect your data. However, no method of transmission over the
							Internet or electronic storage is 100% secure. While we strive to
							use commercially acceptable means to protect your data, we cannot
							guarantee absolute security.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Your Rights
						</h2>
						<div className="flex flex-col gap-4">
							<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
								You have the right to:
							</p>
							<ul className="list-disc list-inside flex flex-col gap-2 text-slate-700 dark:text-slate-300 leading-relaxed">
								<li>Access your personal data</li>
								<li>Delete your account and associated data</li>
								<li>Export your mind maps and project data</li>
								<li>Request correction of inaccurate data</li>
							</ul>
							<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
								To exercise these rights, please contact us or use the account
								management features in the application.
							</p>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Data Retention
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							We retain your data for as long as your account is active or as
							needed to provide our services. If you delete your account, we
							will delete your personal data and projects, subject to any legal
							obligations to retain certain information.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Children's Privacy
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							Our service is not intended for children under 13 years of age. We
							do not knowingly collect personal information from children under
							13. If you believe we have collected information from a child
							under 13, please contact us immediately.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Changes to This Privacy Policy
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							We may update this Privacy Policy from time to time. We will
							notify you of any changes by posting the new Privacy Policy on
							this page and updating the "Last updated" date. You are advised to
							review this Privacy Policy periodically for any changes.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Contact Us
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							If you have any questions about this Privacy Policy, please
							contact us through the application or at the contact information
							provided in your account settings.
						</p>
					</section>
				</div>
			</div>
		</main>
	);
}
