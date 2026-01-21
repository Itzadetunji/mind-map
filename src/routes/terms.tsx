import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
});

function TermsPage() {
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
								<FileText className="w-6 h-6 text-[#03045E] dark:text-[#0077B6]" />
							</div>
							<h1 className="text-4xl font-bold text-slate-900 dark:text-white">
								Terms and Conditions
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
									<li>Transmit any malicious code, viruses, or harmful data</li>
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
										className="text-[#03045E] dark:text-[#0077B6] hover:underline"
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
			</div>
		</main>
	);
}
