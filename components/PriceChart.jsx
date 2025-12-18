"use client"

import { getPriceHistory } from '@/app/action';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function PriceChart({productId}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function loadData() {
            const history = await getPriceHistory(productId);
            const chartData = history.map((item) => ({
                date: new Date(item.checked_at).toLocaleDateString(),
                price: parseFloat(item.price)
            }));
            setData(chartData);
            setLoading(false);
        }
        loadData();
    }, [productId]);
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-gray-400 w-full">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading chart...
            </div>
        );
    }
    
    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 w-full">
                No price history available.
            </div>
        );
    }
 
    return (
        <div className='w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-5'>
            <h4 className='text-sm font-semibold mb-4 text-slate-300'>
                Price History
            </h4>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            borderRadius: "6px",
                            color: "#f1f5f9"
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="url(#lineGradient)"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#1e293b" }}
                        activeDot={{ r: 7 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}