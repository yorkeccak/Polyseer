"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsOfService() {
  const lastUpdated = "December 2025";
  const effectiveDate = "December 8, 2025";

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100">
              Terms of Service
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Last updated: {lastUpdated}
            </p>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm">
              Effective Date: {effectiveDate}
            </p>
          </div>

          {/* Binding Agreement Notice */}
          <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-6">
            <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed text-sm">
              <strong>PLEASE READ THESE TERMS CAREFULLY.</strong> By accessing or using Polyseer, you agree to be bound by these Terms of Service and all applicable laws and regulations. These Terms constitute a legally binding agreement between you and Valyu.ai Ltd, a company registered in England and Wales (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). Polyseer is a service operated by Valyu.ai Ltd. If you do not agree to these Terms, you must not access or use our Service. Your continued use of the Service following the posting of any changes to these Terms constitutes acceptance of those changes.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 text-neutral-900 dark:text-neutral-100">
            
            {/* Important Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200 mb-4">
                Important Notice - Not Financial, Investment, or Legal Advice
              </h2>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed mb-4">
                <strong>Polyseer provides AI-generated analysis for informational, educational, and research purposes only.</strong> Nothing on this platform constitutes, or should be construed as:
              </p>
              <ul className="space-y-2 pl-4 text-amber-800 dark:text-amber-200 mb-4">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Professional financial, investment, or trading advice</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Legal, tax, or accounting advice</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>A recommendation or solicitation to buy, sell, or hold any financial instrument, security, or prediction market position</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>An offer or invitation to engage in any transaction</span>
                </li>
              </ul>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>You are solely responsible for evaluating the merits and risks of any decision you make based on information from our Service. Always conduct your own independent research and consult with qualified, licensed professionals before making any financial, investment, or legal decisions.</strong>
              </p>
            </div>

            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                1. Acceptance of Terms and Eligibility
              </h2>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                By accessing or using Polyseer (&ldquo;Service&rdquo; or &ldquo;Platform&rdquo;), a service operated by Valyu.ai Ltd (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;)
                agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms,
                do not use our Service.
              </p>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  1.1 Eligibility Requirements
                </h3>
                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-2">
                  To use our Service, you must:
                </p>
                <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Be at least 18 years of age (or the age of legal majority in your jurisdiction)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Have the legal capacity to enter into a binding agreement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Not be prohibited from using the Service under applicable laws</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Comply with all applicable laws regarding prediction markets in your jurisdiction</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  1.2 Geographic Restrictions
                </h3>
                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                  Our Service analyzes data from prediction market platforms that may be subject to geographic restrictions.
                  You are solely responsible for determining whether your use of our Service, and any subsequent use of
                  third-party prediction market platforms, complies with the laws of your jurisdiction. We make no
                  representation that the Service is appropriate or available for use in all locations. Access to the
                  Service from jurisdictions where its contents are illegal or restricted is prohibited.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  1.3 Account Registration
                </h3>
                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                  You may be required to authenticate via a third-party service (Valyu) to access certain features.
                  By authenticating, you represent that all information you provide is accurate and complete. You are
                  responsible for maintaining the confidentiality of your account credentials and for all activities
                  that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                2. Description of Service
              </h2>
              
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                Polyseer is an AI-powered research platform that provides deep analysis reports and probabilistic assessments
                for prediction markets, including Polymarket and Kalshi. Our Service uses artificial
                intelligence, machine learning algorithms, and various data sources to generate comprehensive research analysis.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  <strong>Important:</strong> Polyseer does not facilitate any betting, wagering, or financial transactions.
                  We only provide research analysis and may include links to third-party platforms (such as Polymarket and Kalshi)
                  for informational purposes. Any transactions or bets are conducted entirely on third-party platforms
                  and are subject to their own terms and regulations.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  2.1 Service Features
                </h3>
                <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>AI-generated research analysis of prediction market events</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Probabilistic assessments and confidence ratings for educational purposes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Research synthesis from multiple data sources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Historical analysis and trend identification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Links to third-party platforms for reference only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-2">•</span>
                    <span>Credit-based access to research reports via Valyu</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  2.2 Third-Party Platform Links
                </h3>
                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                  Our Service may include links to third-party prediction market platforms such as Polymarket and Kalshi.
                  We are not affiliated with, endorsed by, or responsible for these third-party platforms.
                  Any use of third-party platforms is subject to their own terms of service, privacy policies,
                  and applicable regulations. We do not facilitate, process, or have any involvement in any
                  transactions conducted on third-party platforms.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                3. Educational and Research Purposes Only
              </h2>
              
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                <strong className="text-neutral-900 dark:text-neutral-100">THE SERVICE IS PROVIDED FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY.</strong> 
                All content, analyses, predictions, probabilities, and recommendations provided through 
                our Service are:
              </p>
              
              <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-2">•</span>
                  <span>NOT financial, investment, trading, or legal advice</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-2">•</span>
                  <span>NOT recommendations to buy, sell, or hold any securities or assets</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-2">•</span>
                  <span>NOT guarantees of future performance or outcomes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-2">•</span>
                  <span>Based on algorithms and data that may contain errors or biases</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-2">•</span>
                  <span>Subject to rapid change and may become outdated</span>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                4. AI and Data Limitations
              </h2>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 dark:text-yellow-200 leading-relaxed text-sm">
                  <strong>Critical Understanding:</strong> All content generated by our Service is produced by artificial intelligence systems. AI systems have inherent limitations that you must understand before relying on any output. By using this Service, you acknowledge and accept these limitations.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    4.1 AI-Generated Content Risks
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    Our Service uses large language models (LLMs) and other artificial intelligence technologies to generate analysis. You explicitly acknowledge and accept that AI-generated content:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>May contain &ldquo;hallucinations&rdquo;</strong> - AI systems can generate plausible-sounding but entirely fabricated information, including false citations, non-existent sources, and incorrect factual claims</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>May contain errors</strong> - Mathematical calculations, probability assessments, and logical reasoning may be flawed or incorrect</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>May reflect biases</strong> - AI models may perpetuate biases present in their training data, leading to skewed or prejudiced analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>May be inconsistent</strong> - The same query may produce different results at different times</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>May be outdated</strong> - AI models have knowledge cutoffs and may not reflect current events or recent developments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>Cannot predict the future</strong> - All probability estimates are speculative and should not be relied upon as accurate predictions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span><strong>May misinterpret context</strong> - AI may misunderstand nuances, sarcasm, or complex situations</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    4.2 No Guarantee of Accuracy
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    <strong>WE MAKE NO WARRANTIES OR REPRESENTATIONS REGARDING THE ACCURACY, RELIABILITY, COMPLETENESS, OR TIMELINESS OF ANY CONTENT GENERATED BY OUR SERVICE.</strong> You acknowledge that:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>All probability estimates and forecasts are speculative and for informational purposes only</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>Past performance of our predictions does not indicate future accuracy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>You must independently verify any information before acting upon it</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>We do not guarantee that our analysis will be profitable or beneficial</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    4.3 Data Sources and Third-Party Information
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    Our Service aggregates data from multiple third-party sources. You acknowledge that:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>Third-party data may be delayed, incorrect, incomplete, or manipulated</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>Market data from prediction platforms may not reflect true market conditions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>News and research sources may contain errors, biases, or misinformation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>We have no control over the accuracy or availability of third-party data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-2">•</span>
                      <span>Data processing delays may result in stale or outdated analysis</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    4.4 User Verification Responsibility
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    You are solely responsible for verifying the accuracy of any information provided by our Service before taking any action based on such information. We strongly recommend cross-referencing all data with authoritative primary sources and consulting with qualified professionals.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                5. User Responsibilities
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    5.1 Due Diligence
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">Users are solely responsible for:</p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span>Conducting their own independent research and due diligence</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span>Consulting with qualified financial, legal, and tax advisors</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span>Evaluating the risks associated with any decisions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span>Compliance with all applicable laws and regulations</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    5.2 Prohibited Uses
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">Users may not:</p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Use the Service for illegal activities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Attempt to manipulate or reverse-engineer our algorithms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Share account credentials or access with unauthorized parties</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Use automated systems to scrape or harvest data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Violate any applicable laws or regulations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Misrepresent our research reports as facilitating transactions or betting</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>Use our analysis as the sole basis for financial decisions</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    5.3 Third-Party Platform Interactions
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    When following links to third-party platforms (such as Polymarket), users acknowledge that:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>They are leaving our platform and entering a separate service</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>All activities on third-party platforms are governed by those platforms&rsquo; terms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>We have no control over or responsibility for third-party platform operations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>Any transactions are conducted entirely between the user and the third-party platform</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>Users must comply with all applicable laws regarding prediction markets in their jurisdiction</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                6. Billing and Third-Party Services
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    6.1 Third-Party Authentication and Billing
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    Our Service uses Valyu for authentication (OAuth 2.1) and API credits. By using our Service, you acknowledge and agree that:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Usage of our analysis features consumes Valyu API credits from your Valyu organization account</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Valyu&apos;s terms of service and privacy policy govern your Valyu account and credit usage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>We are not responsible for Valyu&apos;s service availability, pricing changes, or account issues</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Credit costs vary based on analysis complexity and third-party API usage</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    6.2 Data Processing by Third Parties
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    To provide our Service, we process data through third-party services including but not limited to:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Valyu:</strong> Authentication, search queries, and API processing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>OpenAI:</strong> AI model inference for analysis generation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Supabase:</strong> Data storage and session management</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Polymarket/Kalshi APIs:</strong> Market data retrieval</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mt-4">
                    Your queries, market URLs, and analysis requests may be transmitted to and processed by these third-party services. By using our Service, you consent to such data processing.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    6.3 No Refunds for API Usage
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Once an analysis is initiated, Valyu credits are consumed regardless of whether the analysis completes successfully. We do not provide refunds for failed analyses, partial completions, or analyses that do not meet your expectations. API credits are non-refundable once consumed.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                7. Disclaimers and Limitation of Liability
              </h2>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-800 dark:text-red-200 leading-relaxed text-sm">
                  <strong>PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS OUR LIABILITY TO YOU.</strong> The limitations and exclusions in this section apply to the maximum extent permitted by applicable law.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.1 Disclaimer of Warranties
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    THE SERVICE, INCLUDING ALL CONTENT, ANALYSIS, PREDICTIONS, AND INFORMATION, IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT OR ANALYSIS</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>WARRANTIES THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-2">•</span>
                      <span>WARRANTIES REGARDING THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICE</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.2 Exclusion of Consequential Damages
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VALYU.NETWORK LTD, ITS PARENT COMPANIES, SUBSIDIARIES, AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, OR LICENSORS BE LIABLE FOR ANY:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Indirect, incidental, special, consequential, punitive, or exemplary damages</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Loss of profits, revenue, goodwill, or anticipated savings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Loss of data, use, or other intangible losses</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Financial losses from any trading, betting, or investment decisions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses resulting from reliance on any content or analysis provided by the Service</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Damages arising from unauthorized access to or alteration of your data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Any other matter relating to the Service</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mt-4">
                    THESE LIMITATIONS APPLY WHETHER THE ALLEGED LIABILITY IS BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR ANY OTHER BASIS, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.3 Specific Disclaimers for Financial Losses
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    <strong>YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT WE SHALL NOT BE LIABLE FOR ANY FINANCIAL LOSSES WHATSOEVER, INCLUDING BUT NOT LIMITED TO:</strong>
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses from betting, trading, or investing on Polymarket, Kalshi, or any other prediction market platform</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses from decisions made based on our probability estimates or analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses from inaccurate, incomplete, or outdated AI-generated content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses from AI &ldquo;hallucinations&rdquo; or errors in our analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses from market manipulation, fraud, or other misconduct on third-party platforms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Losses arising from regulatory actions or changes affecting prediction markets</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.4 Third-Party Platform Disclaimer
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    We expressly disclaim any and all liability for your interactions with third-party platforms (including but not limited to Polymarket, Kalshi, Valyu, and any prediction market exchange). This includes:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Any transactions, bets, trades, or positions you enter on third-party platforms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Technical failures, outages, or errors on third-party platforms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Disputes with third-party platform operators or other users</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Regulatory, legal, or compliance issues arising from third-party platform usage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">•</span>
                      <span>Loss of funds held on third-party platforms</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.5 Aggregate Liability Cap
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE GREATER OF:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300 mb-4">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">(a)</span>
                      <span>The total amount you paid directly to Valyu.ai Ltd (not including amounts paid to other third parties) in the twelve (12) months immediately preceding the event giving rise to the claim; or</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-2">(b)</span>
                      <span>One Hundred United States Dollars (USD $100.00)</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    This limitation applies regardless of the theory of liability and even if we have been advised of the possibility of such damages.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.6 Force Majeure
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to: acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, shortages of transportation, facilities, fuel, energy, labor, or materials, failure of third-party services (including AI providers, cloud services, and data providers), internet or telecommunications failures, government actions, or any other event beyond our reasonable control.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    7.7 Essential Basis of Agreement
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    You acknowledge and agree that the disclaimers, exclusions, and limitations of liability set forth in these Terms form an essential basis of the agreement between you and Valyu.ai Ltd, and that Valyu.ai Ltd would not provide the Service without these limitations. Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for certain damages. If these laws apply to you, some of the above exclusions or limitations may not apply, and you may have additional rights.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 - Indemnification */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                8. Indemnification
              </h2>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                You agree to indemnify, defend, and hold harmless Valyu.ai Ltd, its parent companies, subsidiaries, affiliates, officers, directors, employees, agents, partners, and licensors from and against any and all claims, demands, losses, damages, costs, liabilities, and expenses (including reasonable attorneys&apos; fees and court costs) arising out of or relating to:
              </p>
              <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-2">•</span>
                  <span>Your use of or access to the Service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-2">•</span>
                  <span>Your violation of these Terms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-2">•</span>
                  <span>Your violation of any rights of any third party, including intellectual property rights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-2">•</span>
                  <span>Your use of third-party platforms accessed through or in connection with our Service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-2">•</span>
                  <span>Any trading, betting, or investment decisions you make based on our Service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-2">•</span>
                  <span>Any content you submit or transmit through the Service</span>
                </li>
              </ul>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mt-4">
                We reserve the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you. In such case, you agree to cooperate with our defense of such claim.
              </p>
            </section>

            {/* Section 9 - Dispute Resolution */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                9. Dispute Resolution and Arbitration
              </h2>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                <p className="text-purple-800 dark:text-purple-200 leading-relaxed text-sm">
                  <strong>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT AND TO HAVE A JURY TRIAL.</strong>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    9.1 Informal Resolution
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Before initiating any formal dispute resolution process, you agree to first contact us at contact@valyu.ai to attempt to resolve any dispute informally. We will attempt to resolve the dispute by contacting you via email. If a dispute is not resolved within thirty (30) days of submission, either party may proceed as set forth below.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    9.2 Binding Arbitration
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    If informal resolution is unsuccessful, any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall be finally resolved by binding arbitration administered by the London Court of International Arbitration (LCIA) under its rules. The arbitration shall be conducted:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>By a single arbitrator mutually agreed upon by the parties</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>In the English language</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-2">•</span>
                      <span>At a location in London, United Kingdom, or remotely via video conference</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mt-4">
                    The arbitrator&apos;s decision shall be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    9.3 Class Action Waiver
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    <strong>YOU AND VALYU.NETWORK LTD AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.</strong> Unless both you and Valyu.ai Ltd agree otherwise, the arbitrator may not consolidate more than one person&apos;s claims and may not preside over any form of representative or class proceeding.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    9.4 Waiver of Jury Trial
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    <strong>YOU HEREBY WAIVE YOUR RIGHT TO A JURY TRIAL</strong> for any claim or dispute arising under or relating to these Terms, whether in arbitration or in any court proceeding where arbitration does not apply.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    9.5 Exceptions
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 - Governing Law */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                10. Governing Law and Jurisdiction
              </h2>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions.
              </p>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                Subject to the arbitration provisions above, the courts of England and Wales shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms. You irrevocably waive any objection to the venue of any legal process on the basis that the process has been brought in an inconvenient forum.
              </p>
            </section>

            {/* Section 11 - Intellectual Property */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                11. Intellectual Property
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    11.1 Our Intellectual Property
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    The Service and all content, features, and functionality (including but not limited to all information, software, text, displays, images, AI models, algorithms, analyses, and the design, selection, and arrangement thereof) are owned by Valyu.ai Ltd, its licensors, or other providers and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    11.2 Limited License
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial use. This license does not include any right to: (a) resell or commercially use the Service; (b) collect or use any content, analysis, or listings for any commercial purpose; (c) make derivative works based on the Service; (d) use data mining, robots, or similar data gathering methods; or (e) use the Service other than for its intended purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    11.3 Feedback
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    If you provide any feedback, suggestions, or ideas regarding the Service (&ldquo;Feedback&rdquo;), you hereby assign to us all rights in such Feedback and agree that we have the right to use and fully exploit such Feedback in any manner without compensation or attribution to you.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12 - Privacy and Data */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                12. Privacy, Data Collection, and Your Rights
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    12.1 Data We Collect
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    When you use our Service, we may collect and process the following categories of data:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Account Information:</strong> Email address, name, and profile information provided via Valyu OAuth</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Analysis Data:</strong> Market URLs you analyze, queries you submit, and resulting analysis reports</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Usage Data:</strong> Analysis history, timestamps, API usage, and session information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span><strong>Technical Data:</strong> Browser type, device information, and anonymized analytics data</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    12.2 How We Use Your Data
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    We use your data to:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Provide, maintain, and improve the Service</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Process your analysis requests and store your analysis history</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Authenticate your identity and manage your account</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-2">•</span>
                      <span>Comply with legal obligations</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    12.3 Your Data Rights (GDPR/CCPA)
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                    Depending on your jurisdiction, you may have the following rights regarding your personal data:
                  </p>
                  <ul className="space-y-2 pl-6 text-neutral-700 dark:text-neutral-300">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span><strong>Right to Access:</strong> Request a copy of your personal data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span><strong>Right to Rectification:</strong> Request correction of inaccurate data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span><strong>Right to Erasure:</strong> Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span><strong>Right to Data Portability:</strong> Request your data in a machine-readable format</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span><strong>Right to Object:</strong> Object to certain data processing activities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-2">•</span>
                      <span><strong>Right to Opt-Out of Sale (CCPA):</strong> We do not sell personal information</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mt-4">
                    To exercise any of these rights, please contact us at contact@valyu.ai. We will respond to your request within the timeframes required by applicable law.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    12.4 Data Retention
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. Analysis history is retained indefinitely unless you request deletion.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 13 - Termination */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                13. Termination
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    13.1 Termination by Us
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    We may suspend or terminate your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. We may also discontinue the Service at any time without notice.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    13.2 Termination by You
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    You may terminate your account at any time by discontinuing use of the Service and revoking access through Valyu. You may also contact us to request account deletion.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    13.3 Effect of Termination
                  </h3>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Upon termination, your right to use the Service will immediately cease. Sections of these Terms that by their nature should survive termination shall survive, including but not limited to: ownership provisions, warranty disclaimers, indemnification obligations, limitations of liability, dispute resolution provisions, and governing law.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 14 - Changes to Terms */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                14. Changes to Terms
              </h2>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the &ldquo;Last Updated&rdquo; date. For significant changes, we may also notify you via email if you have provided one.
              </p>
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                Your continued use of the Service after the effective date of any changes constitutes your acceptance of the modified Terms. If you do not agree to the updated Terms, you must stop using the Service.
              </p>
            </section>

            {/* Section 15 - General Provisions */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                15. General Provisions
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Entire Agreement</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    These Terms, together with our Privacy Policy and any other agreements expressly incorporated by reference, constitute the entire agreement between you and Valyu.ai Ltd regarding the Service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Severability</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Waiver</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    No waiver of any term or condition shall be deemed a further or continuing waiver of such term or any other term. Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Assignment</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">No Third-Party Beneficiaries</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    These Terms do not create any third-party beneficiary rights in any person, except as expressly provided.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Headings</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    The section headings in these Terms are for convenience only and have no legal or contractual effect.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 16 - Contact Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                16. Contact Information
              </h2>
              <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-6">
                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                  For questions about these Terms, to exercise your data rights, or for any other inquiries regarding our Service, please contact us:
                </p>
                <ul className="space-y-2 text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-3">Email:</span>
                    <span>contact@valyu.ai</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-3">Website:</span>
                    <span><Link href="/" className="text-blue-600 hover:text-blue-700 underline">polyseer.xyz</Link></span>
                  </li>
                </ul>
                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300 mt-4 text-sm">
                  We aim to respond to all inquiries within 30 days. For data protection requests from EU residents, we will respond within the timeframes required by GDPR.
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Acknowledgment
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. YOU ALSO ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD OUR PRIVACY POLICY. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE THE SERVICE.
              </p>
            </div>

            {/* Final Risk Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">
                Final Risk Warning and Disclaimer
              </h3>
              <div className="space-y-4 text-red-800 dark:text-red-200 leading-relaxed">
                <p>
                  <strong>PREDICTION MARKETS AND TRADING INVOLVE SUBSTANTIAL RISK OF LOSS.</strong>
                </p>
                <ul className="space-y-2 pl-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Past performance does not guarantee future results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>All predictions and probabilities are speculative and are NOT guarantees of outcomes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>AI-generated analysis may contain errors, inaccuracies, or &ldquo;hallucinations&rdquo;</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You may lose some or all of your capital if you trade or invest based on our analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Only trade or invest what you can afford to lose entirely</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Prediction markets may be restricted or prohibited in your jurisdiction</span>
                  </li>
                </ul>
                <p className="mt-4">
                  <strong>ALWAYS conduct your own independent research. ALWAYS consult with qualified, licensed financial and legal professionals before making any financial decisions. NEVER rely solely on AI-generated analysis for trading or investment decisions.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-8">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              ← Back to Polyseer
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}