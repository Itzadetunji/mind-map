import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
			{/* Navigation */}
			<nav className="sticky top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<img
							src="/assets/brand/logo-transparent.png"
							alt="ProtoMap"
							className="h-8 w-8"
						/>
						<span className="text-xl font-bold text-primary dark:text-white">
							ProtoMap
						</span>
					</Link>
					<div className="hidden md:flex items-center gap-8">
						<Link
							to="/"
							className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
						>
							Home
						</Link>
						<Link
							to="/terms"
							className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
						>
							Terms
						</Link>
					</div>
					<Link to="/projects">
						<Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
							Launch App
						</Button>
					</Link>
				</div>
			</nav>

			{/* Header Section */}
			<section className="pt-16 pb-12 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 dark:bg-[#0077B6]/20 mb-6">
						<Shield className="w-8 h-8 text-primary dark:text-[#0077B6]" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">
						Privacy Policy
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Last updated:{" "}
						{new Date().toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>
			</section>

			{/* Content */}
			<section className="pb-24 px-6">
				<div className="max-w-4xl mx-auto flex flex-col gap-12">
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
										className="text-primary dark:text-[#0077B6] hover:underline"
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
										className="text-primary dark:text-[#0077B6] hover:underline"
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
			</section>

			{/* Footer */}
			<footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
						<p>© 2026 ProtoMap. All rights reserved.</p>
						<div className="flex items-center gap-6 mt-4 md:mt-0">
							<Link
								to="/privacy"
								className="hover:text-primary dark:hover:text-white transition-colors"
							>
								Privacy Policy
							</Link>
							<Link
								to="/terms"
								className="hover:text-primary dark:hover:text-white transition-colors"
							>
								Terms of Service
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
