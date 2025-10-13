"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { Category } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<(Category & { product_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC6 100%)' }}>
      <div className="container mx-auto px-4 py-10">
        <SectionTitle title="Categorias" subtitle="Explore nossos baús de tesouros" align="center" />

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-2" style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((c) => (
              <Link key={c.id} href={`/products?category=${c.id}`} className="vintage-card p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-3">{c.icon || '📦'}</div>
                <h3 className="font-vintage-subtitle" style={{ color: '#3C3C3C' }}>{c.name}</h3>
                {c.product_count !== undefined && (
                  <p className="text-sm font-vintage-body mt-1" style={{ color: '#6B4C57' }}>{c.product_count} itens</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
