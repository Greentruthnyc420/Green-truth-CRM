import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Database, Zap, Shield, BarChart, Gem, Layers } from 'lucide-react';

const ParallaxSection = ({ children, backgroundImage, speed = -0.3 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, y }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const FeatureCard = ({ icon, title, children, delay }) => {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true, amount: 0.3 }}
      className="bg-gray-900 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 border border-green-300/20 shadow-2xl shadow-green-500/10"
    >
      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#10b981] to-[#065f46] rounded-full mb-6">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{children}</p>
    </motion.div>
  );
};

const LandingPage = () => {
  return (
    <div className="bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1618059432098-b8364c7003f7?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=3456)' }}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 10, ease: 'easeInOut' }}
        />
        <div className="relative z-20 p-8">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight"
            style={{ textShadow: '0px 4px 20px rgba(0, 255, 150, 0.3)' }}
          >
            Your Cannabis Distribution
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#a7f3d0]">
              Command Center
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-gray-300"
          >
            Streamline operations, boost sales, and cultivate growth with an all-in-one platform designed for the cannabis industry.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2, type: 'spring', stiffness: 150 }}
          >
            <Link
              to="/gateway"
              className="mt-12 inline-block bg-gradient-to-r from-[#10b981] to-[#065f46] text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-green-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50"
            >
              Access Gateway
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <ParallaxSection backgroundImage="https://images.unsplash.com/photo-1556928045-16f7f50be0f3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=3456">
        <div className="py-24 px-4 sm:px-6 lg:px-8 bg-black/70">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-white">The Ultimate Toolkit for Cannabis Pros</h2>
              <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
                From seed to sale, our platform provides the tools you need to thrive in a competitive market.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard icon={Database} title="Unified CRM" delay={0.1}>
                Manage all your clients, leads, and dispensaries in one centralized hub. Track every interaction and never miss an opportunity.
              </FeatureCard>
              <FeatureCard icon={Zap} title="Seamless Integrations" delay={0.2}>
                Connect with the tools you already use. Live integration with Monday.com, with more platforms in beta.
              </FeatureCard>
              <FeatureCard icon={BarChart} title="Actionable Analytics" delay={0.3}>
                Gain deep insights into your sales data, team performance, and market trends. Make data-driven decisions with confidence.
              </FeatureCard>
              <FeatureCard icon={Gem} title="Generous FREE Tier" delay={0.4}>
                Get started with our powerful core features at no cost. Perfect for growing businesses and independent reps.
              </FeatureCard>
              <FeatureCard icon={Shield} title="Bank-Grade Security" delay={0.5}>
                Your data is your most valuable asset. We protect it with end-to-end encryption and enterprise-level security protocols.
              </FeatureCard>
              <FeatureCard icon={Layers} title="Multi-Portal Access" delay={0.6}>
                Dedicated portals for Sales Reps, Brands, and Dispensaries, all seamlessly connected for maximum efficiency.
              </FeatureCard>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* CTA Section */}
      <div className="bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold text-white"
          >
            Ready to Elevate Your Business?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, amount: 0.5 }}
            className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Join the forward-thinking brands and reps who are shaping the future of the cannabis industry. Your command center awaits.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 150 }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <Link
              to="/gateway"
              className="mt-10 inline-block bg-gradient-to-r from-[#10b981] to-[#065f46] text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-green-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50"
            >
              Access Gateway
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-green-500/10">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Green Truth NYC. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
