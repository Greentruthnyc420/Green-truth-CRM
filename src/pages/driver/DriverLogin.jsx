import React, { useState } from 'react';
import { Truck, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDrivers } from '../../services/firestoreService';

export default function DriverLogin() {
    const [license, setLicense] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Fetch all drivers (or filter by license if we add that to service)
            // For now, get all and find. Safety: License should be unique.
            const allDrivers = await getDrivers(); // getDrivers takes brandId, null = all? Service implementation check: Yes, "let query = ... if(brandId)..." so null gets all
            const driver = allDrivers.find(d => d.license === license || d.licenseNumber === license); // Handle inconsistent naming convention if any

            if (driver) {
                // Login Success
                localStorage.setItem('driver_session', JSON.stringify(driver));
                navigate('/driver/dashboard');
            } else {
                setError('Invalid Driver License Number');
            }
        } catch (err) {
            console.error(err);
            setError('System error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Developer bypass login (DEV ONLY)
    const devDriverLogin = () => {
        if (!import.meta.env.DEV) {
            console.warn("Dev login is disabled in production.");
            return;
        }

        const mockDriver = {
            id: 'dev-driver-1',
            name: 'Dev Driver',
            license: 'D999-TEST',
            brandId: 'flx-extracts'
        };

        localStorage.setItem('driver_session', JSON.stringify(mockDriver));
        navigate('/driver/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Gateway</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Driver Access</h1>
                    <p className="text-slate-500">Enter your license number to view route.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Driver License #</label>
                        <input
                            type="text"
                            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-lg font-mono focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                            placeholder="D123..."
                            value={license}
                            onChange={(e) => setLicense(e.target.value.toUpperCase())}
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl shadow-brand-200"
                    >
                        {loading ? 'Verifying...' : 'Access Route'} <ChevronRight size={20} />
                    </button>
                </form>

                {/* Developer Bypass - DEV ONLY */}
                {import.meta.env.DEV && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <button
                            onClick={devDriverLogin}
                            className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm border border-slate-300"
                        >
                            🔧 Dev Login (Test Driver)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
