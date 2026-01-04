import React from 'react';
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Sprout, Crown } from 'lucide-react';

const KingCropHeader = () => {
    return (
        <div className="flex flex-col items-center justify-center py-6">
            <div className="relative mb-4"> {/* Container for Icons */}
                {/* Plant: Springs up from 0 */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="text-green-600"
                >
                    <Sprout size={64} />
                </motion.div>

                {/* Crown: Drops down onto the plant */}
                <motion.div
                    initial={{ y: -60, opacity: 0, scale: 0.5 }}
                    animate={{ y: -35, opacity: 1, scale: 1 }} // Adjust y to sit perfectly on top
                    transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute top-0 left-0 w-full flex justify-center text-yellow-500 z-10"
                >
                    <Crown size={40} fill="currentColor" />
                </motion.div>
            </div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black text-slate-800 tracking-tight"
            >
                King of the Crop
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-slate-500 font-medium mt-2"
            >
                Ranked by Revenue & Leads
            </motion.p>
        </div>
    );
};

export default KingCropHeader;
