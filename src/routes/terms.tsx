import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
});

function TermsPage() {
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
							to="/privacy"
							className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
						>
							Privacy
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
						<FileText className="w-8 h-8 text-primary dark:text-[#0077B6]" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">
						Terms and Conditions
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Last updated: February 1, 2026
					</p>
				</div>
			</section>

			{/* Content */}
			<section className="pb-24 px-6">
				<div className="max-w-4xl mx-auto flex flex-col gap-12">
					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Acceptance of Terms
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							By accessing and using Proto Map ("the Service"), you accept and
							agree to be bound by the terms and provision of this agreement. If
							you do not agree to these Terms and Conditions, please do not use
							our Service.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Description of Service
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							Proto Map is a web-based application that allows users to create,
							manage, and visualize mind maps and user flow diagrams. The
							Service includes AI-powered features that generate and modify mind
							maps based on user prompts.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							User Accounts
						</h2>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Account Creation
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									To use certain features of the Service, you must create an
									account by signing in with Google. You are responsible for
									maintaining the confidentiality of your account credentials.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Account Responsibility
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									You are responsible for all activities that occur under your
									account. You agree to notify us immediately of any
									unauthorized use of your account.
								</p>
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Use of the Service
						</h2>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Permitted Use
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									You may use the Service to create, store, and manage your own
									mind maps and user flow diagrams for personal or commercial
									purposes, subject to these Terms.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Prohibited Use
								</h3>
								<div className="flex flex-col gap-2">
									<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
										You agree not to:
									</p>
									<ul className="list-disc list-inside flex flex-col gap-2 text-slate-700 dark:text-slate-300 leading-relaxed">
										<li>
											Use the Service for any illegal or unauthorized purpose
										</li>
										<li>Violate any laws in your jurisdiction</li>
										<li>
											Transmit any malicious code, viruses, or harmful data
										</li>
										<li>
											Attempt to gain unauthorized access to the Service or its
											systems
										</li>
										<li>Interfere with or disrupt the Service or servers</li>
										<li>
											Use the Service to create content that is defamatory,
											harassing, or violates others' rights
										</li>
									</ul>
								</div>
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							AI-Generated Content
						</h2>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									OpenAI Integration
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									The Service uses OpenAI's API to generate and modify mind maps
									based on your prompts.{" "}
									<strong>
										We do not control OpenAI's services, and your use of AI
										features is subject to OpenAI's terms of service.
									</strong>{" "}
									We recommend reviewing{" "}
									<a
										href="https://openai.com/policies/terms-of-use"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary dark:text-[#0077B6] hover:underline"
									>
										OpenAI's Terms of Use
									</a>{" "}
									to understand their policies.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Content Accuracy
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									AI-generated content may contain errors or inaccuracies. You
									are responsible for reviewing and verifying any AI-generated
									content before using it. We do not guarantee the accuracy,
									completeness, or usefulness of AI-generated mind maps.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Content Ownership
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									You retain ownership of the mind maps you create. However, by
									using AI features, you acknowledge that OpenAI may use your
									prompts in accordance with their terms of service.
								</p>
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Intellectual Property
						</h2>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Your Content
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									You retain all rights to the mind maps and content you create
									using the Service. You grant us a license to store, display,
									and process your content solely for the purpose of providing
									the Service.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="text-xl font-medium text-slate-900 dark:text-white">
									Service Intellectual Property
								</h3>
								<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
									The Service, including its design, features, and
									functionality, is owned by us and protected by copyright,
									trademark, and other intellectual property laws.
								</p>
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Service Availability
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							We strive to provide reliable service but do not guarantee that
							the Service will be available at all times. The Service may be
							unavailable due to maintenance, updates, or circumstances beyond
							our control. We are not liable for any loss or damage resulting
							from Service unavailability.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Limitation of Liability
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							To the maximum extent permitted by law, we shall not be liable for
							any indirect, incidental, special, consequential, or punitive
							damages, or any loss of profits or revenues, whether incurred
							directly or indirectly, or any loss of data, use, goodwill, or
							other intangible losses resulting from your use of the Service.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Disclaimer of Warranties
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							The Service is provided "as is" and "as available" without
							warranties of any kind, either express or implied. We do not
							warrant that the Service will be uninterrupted, secure, or
							error-free.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Termination
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							We reserve the right to terminate or suspend your account and
							access to the Service at our sole discretion, without notice, for
							conduct that we believe violates these Terms or is harmful to
							other users, us, or third parties. You may also terminate your
							account at any time by deleting it through the Service.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Changes to Terms
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							We reserve the right to modify these Terms at any time. We will
							notify you of any changes by posting the new Terms on this page
							and updating the "Last updated" date. Your continued use of the
							Service after such changes constitutes acceptance of the new
							Terms.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Governing Law
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							These Terms shall be governed by and construed in accordance with
							the laws of the jurisdiction in which we operate, without regard
							to its conflict of law provisions.
						</p>
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
							Contact Information
						</h2>
						<p className="text-slate-700 dark:text-slate-300 leading-relaxed">
							If you have any questions about these Terms and Conditions, please
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
