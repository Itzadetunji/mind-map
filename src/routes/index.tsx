import { createFileRoute, Link } from "@tanstack/react-router";
import { SubscriptionPlanGrid } from "@/components/shared/SubscriptionPlanCard";
import { MindMapConnectionLines } from "@/components/svg-icons/MindMapConnectionLines";
import { Button } from "@/components/ui/button";
import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import {
	ArrowRight,
	Brain,
	Check,
	FileText,
	GitBranch,
	MessageSquare,
	Shield,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";

const LandingPage = () => {
	return (
		<ReactLenis root>
			<div className="min-h-dvh bg-white dark:bg-black no-scrollbar">
				{/* Navigation */}
				<nav className="sticky top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
					<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<img
								src="/assets/brand/logo-transparent.png"
								alt="ProtoMap"
								className="h-8 w-8"
							/>
							<span className="text-xl font-bold text-primary dark:text-white">
								ProtoMap
							</span>
						</div>
						<div className="hidden md:flex items-center gap-8">
							<a
								href="#features"
								className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
							>
								Features
							</a>
							<a
								href="#pricing"
								className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
							>
								Pricing
							</a>
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

				<div className="overflow-x-hidden">
					{/* Hero Section */}
					<section className="pt-16 pb-20 px-6 relative overflow-hidden">
						{/* Background gradient orbs */}
						<div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
						<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0077B6]/10 rounded-full blur-3xl" />

						<div className="max-w-5xl mx-auto text-center relative z-10">
							{/* Badge */}
							<div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full text-sm text-primary dark:text-[#0077B6] mb-8">
								<Sparkles className="w-4 h-4" />
								<span>Turn random ideas into clear app plans</span>
							</div>
							<h1 className="text-5xl md:text-7xl font-bold text-primary dark:text-white mb-6 leading-tight">
								Build your ideas,
								<br />
								<span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-[#0077B6]">
									visually.
								</span>
							</h1>
							Turn random ideas into clear app plans
							<p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
								Transform your product vision into structured mind maps with AI.
								Plan features, map user flows, and generate documentation—all in
								one place.
							</p>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
								<Link to="/projects">
									<Button
										size="lg"
										className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg gap-2"
									>
										Start Building Free
										<ArrowRight className="w-5 h-5" />
									</Button>
								</Link>
								<a href="#features">
									<Button
										size="lg"
										variant="outline"
										className="rounded-full px-8 h-14 text-lg border-slate-300 dark:border-slate-700"
									>
										See How It Works
									</Button>
								</a>
							</div>
							<p className="text-sm text-slate-500 mt-6">
								Free to start · No credit card required
							</p>
						</div>

						{/* Hero Image/Demo Preview */}
						<div className="max-w-6xl mx-auto mt-16 relative">
							<div className="bg-linear-to-b from-slate-100 to-white dark:from-slate-900 dark:to-black rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
								<div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
									<div className="flex gap-1.5">
										<div className="w-3 h-3 rounded-full bg-red-400" />
										<div className="w-3 h-3 rounded-full bg-yellow-400" />
										<div className="w-3 h-3 rounded-full bg-green-400" />
									</div>
									<span className="text-xs text-slate-500 ml-2">
										protomap.art
									</span>
								</div>
								<div className="aspect-video bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 flex items-center justify-center">
									{/* Mind map preview illustration */}
									<div className="relative w-full max-w-4xl h-full min-h-75">
										{/* Center node */}
										<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-6 py-3 rounded-xl shadow-lg font-medium z-10">
											🚀 My SaaS App
										</div>

										{/* Connected nodes */}
										<div className="absolute top-[15%] left-[15%] bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md text-sm border border-slate-200 dark:border-slate-700">
											<span className="text-blue-600">📱</span> User Dashboard
										</div>
										<div className="absolute top-[15%] right-[15%] bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md text-sm border border-slate-200 dark:border-slate-700">
											<span className="text-green-600">💳</span> Payments
										</div>
										<div className="absolute bottom-[20%] left-[10%] bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md text-sm border border-slate-200 dark:border-slate-700">
											<span className="text-purple-600">🔐</span> Authentication
										</div>
										<div className="absolute bottom-[20%] right-[10%] bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md text-sm border border-slate-200 dark:border-slate-700">
											<span className="text-orange-600">📊</span> Analytics
										</div>
										<div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md text-sm border border-slate-200 dark:border-slate-700">
											<span className="text-pink-600">⚡</span> API Layer
										</div>

										{/* Connection lines (simplified) */}
										<MindMapConnectionLines
											className="absolute inset-0 w-full h-full pointer-events-none"
											style={{ zIndex: 0 }}
										/>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Vision Statement Section - with corner decorations like whsprs.ai */}
					<section className="py-24 px-6">
						<div className="max-w-4xl mx-auto relative">
							{/* Corner decorations */}
							<div className="absolute top-0 left-0 w-8 h-8">
								<div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 dark:bg-slate-700" />
								<div className="absolute top-0 left-1/2 w-px h-full bg-slate-300 dark:bg-slate-700" />
							</div>
							<div className="absolute top-0 right-0 w-8 h-8">
								<div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 dark:bg-slate-700" />
								<div className="absolute top-0 left-1/2 w-px h-full bg-slate-300 dark:bg-slate-700" />
							</div>
							<div className="absolute bottom-0 left-0 w-8 h-8">
								<div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 dark:bg-slate-700" />
								<div className="absolute top-0 left-1/2 w-px h-full bg-slate-300 dark:bg-slate-700" />
							</div>
							<div className="absolute bottom-0 right-0 w-8 h-8">
								<div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 dark:bg-slate-700" />
								<div className="absolute top-0 left-1/2 w-px h-full bg-slate-300 dark:bg-slate-700" />
							</div>

							{/* Content */}
							<div className="py-16 px-8 md:px-16">
								<p className="text-2xl md:text-3xl text-slate-900 dark:text-white leading-relaxed font-light">
									We believe every great product starts with a clear vision.
								</p>
								<p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed mt-6">
									ProtoMap is an AI-powered planning tool that helps founders,
									developers, and product teams transform ideas into structured
									mind maps—making it easier to visualize, iterate, and ship
									faster.
								</p>
							</div>
						</div>
					</section>

					{/* Features Section */}
					{/** biome-ignore lint/correctness/useUniqueElementIds: It's a section */}
					<section
						id="features"
						className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50"
					>
						<div className="max-w-6xl mx-auto">
							<div className="text-center mb-16">
								<h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">
									Everything you need to plan your product
								</h2>
								<p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
									From initial idea to structured documentation. ProtoMap helps
									you think through every aspect of your product.
								</p>
							</div>

							<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
								{/* Feature 1 */}
								<div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
									<div className="w-12 h-12 bg-primary/10 dark:bg-[#0077B6]/20 rounded-xl flex items-center justify-center mb-6">
										<Brain className="w-6 h-6 text-primary dark:text-[#0077B6]" />
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										AI-Powered Generation
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Describe your idea and watch as AI generates a comprehensive
										mind map with features, user flows, and technical
										considerations.
									</p>
								</div>

								{/* Feature 2 */}
								<div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
									<div className="w-12 h-12 bg-primary/10 dark:bg-[#0077B6]/20 rounded-xl flex items-center justify-center mb-6">
										<MessageSquare className="w-6 h-6 text-primary dark:text-[#0077B6]" />
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Chat to Refine
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Have a conversation with AI to expand, modify, or dive
										deeper into specific areas of your mind map.
									</p>
								</div>

								{/* Feature 3 */}
								<div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
									<div className="w-12 h-12 bg-primary/10 dark:bg-[#0077B6]/20 rounded-xl flex items-center justify-center mb-6">
										<GitBranch className="w-6 h-6 text-primary dark:text-[#0077B6]" />
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Interactive Canvas
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Drag, connect, and reorganize nodes freely. Build complex
										product structures with an intuitive visual interface.
									</p>
								</div>

								{/* Feature 4 */}
								<div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
									<div className="w-12 h-12 bg-primary/10 dark:bg-[#0077B6]/20 rounded-xl flex items-center justify-center mb-6">
										<FileText className="w-6 h-6 text-primary dark:text-[#0077B6]" />
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Export Documentation
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Generate professional product documentation from your mind
										maps. Export as markdown or share with your team.
									</p>
								</div>

								{/* Feature 5 */}
								<div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
									<div className="w-12 h-12 bg-primary/10 dark:bg-[#0077B6]/20 rounded-xl flex items-center justify-center mb-6">
										<Users className="w-6 h-6 text-primary dark:text-[#0077B6]" />
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Share & Collaborate
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Share your mind maps with teammates, stakeholders, or
										clients via secure links. Everyone stays aligned.
									</p>
								</div>

								{/* Feature 6 */}
								<div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
									<div className="w-12 h-12 bg-primary/10 dark:bg-[#0077B6]/20 rounded-xl flex items-center justify-center mb-6">
										<Zap className="w-6 h-6 text-primary dark:text-[#0077B6]" />
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Fast & Intuitive
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										No learning curve. Start mapping your ideas in seconds with
										a clean, distraction-free interface built for speed.
									</p>
								</div>
							</div>
						</div>
					</section>

					{/* How It Works Section */}
					<section className="py-24 px-6">
						<div className="max-w-6xl mx-auto">
							<div className="text-center mb-16">
								<h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">
									From idea to plan in minutes
								</h2>
								<p className="text-lg text-slate-600 dark:text-slate-400">
									Three simple steps to transform your vision into a structured
									roadmap.
								</p>
							</div>

							<div className="grid md:grid-cols-3 gap-12">
								<div className="text-center">
									<div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
										1
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Describe Your Idea
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Tell the AI about your product idea, target users, and key
										features you're envisioning.
									</p>
								</div>

								<div className="text-center">
									<div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
										2
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										AI Generates Your Map
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Watch as AI creates a structured mind map with features,
										flows, and technical architecture.
									</p>
								</div>

								<div className="text-center">
									<div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
										3
									</div>
									<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
										Refine & Export
									</h3>
									<p className="text-slate-600 dark:text-slate-400">
										Chat with AI to expand areas, reorganize nodes, and export
										your finalized product plan.
									</p>
								</div>
							</div>
						</div>
					</section>

					{/* Pricing Section */}
					{/** biome-ignore lint/correctness/useUniqueElementIds: It's a landing page */}
					<section
						id="pricing"
						className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50"
					>
						<div className="max-w-5xl mx-auto">
							<div className="text-center mb-16">
								<h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">
									Pick the plan that fits your workflow
								</h2>
								<p className="text-lg text-slate-600 dark:text-slate-400">
									Start free, upgrade when you're ready. Cancel anytime.
								</p>
							</div>

							<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
								<SubscriptionPlanGrid mode="landing" />
							</div>

							{/* Trust badges */}
							<div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
								<div className="flex items-center gap-2">
									<Shield className="w-4 h-4" />
									<span>GDPR Compliant</span>
								</div>
								<div className="flex items-center gap-2">
									<Check className="w-4 h-4" />
									<span>Secure Checkout</span>
								</div>
								<div className="flex items-center gap-2">
									<Check className="w-4 h-4" />
									<span>Cancel Anytime</span>
								</div>
								<div className="flex items-center gap-2">
									<MessageSquare className="w-4 h-4" />
									<span>Email Support</span>
								</div>
							</div>
						</div>
					</section>

					{/* CTA Section */}
					<section className="py-24 px-6">
						<div className="max-w-4xl mx-auto text-center">
							<div className="bg-linear-to-br from-primary to-[#0077B6] rounded-3xl p-12 md:p-16 text-white">
								<h2 className="text-3xl md:text-4xl font-bold mb-4">
									Ready to build your next big idea?
								</h2>
								<p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
									Join thousands of founders and builders who use ProtoMap to
									plan their products.
								</p>
								<Link to="/projects">
									<Button
										size="lg"
										className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-14 text-lg"
									>
										Get Started
									</Button>
								</Link>
							</div>
						</div>
					</section>

					{/* Footer */}
					<footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800">
						<div className="max-w-6xl mx-auto">
							<div className="grid md:grid-cols-4 gap-8 mb-12">
								{/* Brand */}
								<div className="md:col-span-2">
									<div className="flex items-center gap-2 mb-4">
										<img
											src="/assets/brand/logo-transparent.png"
											alt="ProtoMap"
											className="h-8 w-8"
										/>
										<span className="text-xl font-bold text-primary dark:text-white">
											ProtoMap
										</span>
									</div>
									<p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
										AI-powered mind mapping for builders. Transform your product
										vision into structured plans.
									</p>
								</div>

								{/* Links */}
								<div>
									<h4 className="font-semibold text-slate-900 dark:text-white mb-4">
										Product
									</h4>
									<ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
										<li>
											<a
												href="#features"
												className="hover:text-primary dark:hover:text-white transition-colors"
											>
												Features
											</a>
										</li>
										<li>
											<a
												href="#pricing"
												className="hover:text-primary dark:hover:text-white transition-colors"
											>
												Pricing
											</a>
										</li>
										<li>
											<Link
												to="/projects"
												className="hover:text-primary dark:hover:text-white transition-colors"
											>
												Launch App
											</Link>
										</li>
									</ul>
								</div>

								{/* Legal */}
								<div>
									<h4 className="font-semibold text-slate-900 dark:text-white mb-4">
										Legal
									</h4>
									<ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
										<li>
											<Link
												to="/privacy"
												className="hover:text-primary dark:hover:text-white transition-colors"
											>
												Privacy Policy
											</Link>
										</li>
										<li>
											<Link
												to="/terms"
												className="hover:text-primary dark:hover:text-white transition-colors"
											>
												Terms of Service
											</Link>
										</li>
									</ul>
								</div>
							</div>

							{/* Bottom */}
							<div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
								<p>© 2026 ProtoMap. All rights reserved.</p>
								<p className="mt-2 md:mt-0">
									Designed with ❤️ for builders everywhere.
								</p>
							</div>
						</div>
					</footer>
				</div>
			</div>
		</ReactLenis>
	);
};

export const Route = createFileRoute("/")({
	component: LandingPage,
});
