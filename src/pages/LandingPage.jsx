import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Database, Zap, Shield, BarChart, Gem, Layers, Send, CheckCircle2, Loader2, Phone, Mail, Building2, User } from 'lucide-react';
import { sendAdminNotification, createPartnershipEmail } from '../services/adminNotifications';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const ParallaxSection = ({ children, backgroundImage, speed = -0.3 }) => {
  // ... existing ParallaxSection code ...
};

const FeatureCard = ({ icon, title, children, delay }) => {
  // ... existing FeatureCard code ...
};

const PartnershipForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: 'Brand',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const sendPartnershipInquiry = httpsCallable(functions, 'sendPartnershipInquiry');
      const result = await sendPartnershipInquiry({ formData });

      if (result.data.success) {
        setStatus('success');
        setFormData({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          businessType: 'Brand',
          message: ''
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-green-500/20 shadow-2xl relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Inquiry Received!</h3>
            <p className="text-gray-400 max-w-sm mx-auto">
              Thank you for your interest. A Green Truth representative will reach out to you within 24-48 hours.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-8 text-green-400 font-medium hover:underline"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Building2 size={16} /> Company Name
                </label>
                <input
                  required
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Green Leaf Extracts"
                  className="w-full bg-black/50 border border-green-500/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <User size={16} /> Contact Name
                </label>
                <input
                  required
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full bg-black/50 border border-green-500/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Mail size={16} /> Email Address
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                  className="w-full bg-black/50 border border-green-500/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Phone size={16} /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  className="w-full bg-black/50 border border-green-500/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Business Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Brand', 'Processor', 'Other'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessType: type })}
                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${formData.businessType === type
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-black/50 border-green-500/10 text-gray-500 hover:border-green-500/30'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">How can we help you?</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about your brand or processing facility..."
                className="w-full bg-black/50 border border-green-500/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-gradient-to-r from-[#10b981] to-[#065f46] text-white font-bold rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:grayscale disabled:hover:scale-100"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Inquiry...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Request Partnership Details
                </>
              )}
            </button>
            {status === 'error' && (
              <p className="text-red-400 text-sm text-center">
                Something went wrong. Please try again or email us directly.
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
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
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <Link
              to="/gateway"
              className="inline-block bg-gradient-to-r from-[#10b981] to-[#065f46] text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-green-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50"
            >
              Access Gateway
            </Link>
            <a
              href="#partnership"
              className="inline-block bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-white/10 transition-all duration-300"
            >
              Partner With Us
            </a>
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

      {/* Partnership Section */}
      <section id="partnership" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Scale Your Brand With <br />
              <span className="text-green-400">Green Truth</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Are you a processor or brand owner looking for powerful distribution software, real-time analytics, and seamless CRM integrations? Let's grow together.
            </p>

            <ul className="space-y-6">
              {[
                { title: 'Brand Visibility', desc: 'Get your products in front of our verified network of dispensaries.' },
                { title: 'Real-Time ROI', desc: 'Track the impact of every store activation and marketing dollar.' },
                { title: 'Order Automation', desc: 'Streamline your fulfillment process with our integrated order manager.' }
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="mt-1 bg-green-500/20 p-1.5 rounded-lg h-fit">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{item.title}</h4>
                    <p className="text-gray-500">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <PartnershipForm />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-[#0a0a0a] border-t border-green-500/5">
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
