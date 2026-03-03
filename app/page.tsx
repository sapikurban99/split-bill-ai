import Link from 'next/link';

function Linkedin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function Instagram({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="bg-background-dark text-white min-h-screen flex flex-col">
      {/* ────── NAVBAR ────── */}
      <nav className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
            </div>
            <span className="text-xl font-bold">
              Split<span className="text-primary">Bill</span>
            </span>
          </div>
          <Link
            href="/split-bill"
            className="bg-primary text-background-dark px-5 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            Mulai Sekarang
          </Link>
        </div>
      </nav>

      {/* ────── HERO ────── */}
      <section className="relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Ditenagai AI — Otomatis & Akurat
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 max-w-3xl mx-auto">
            Bagi Tagihan <span className="text-primary">Tanpa Ribet,</span><br />
            Cukup Foto Struk
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload foto struk belanjamu, AI kami langsung mengenali semua item dan harganya.
            Tinggal pilih siapa makan apa — selesai, adil, tanpa drama.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/split-bill"
              className="group flex items-center gap-2 bg-primary text-background-dark px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add_a_photo</span>
              Upload Struk
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <a
              href="#cara-kerja"
              className="flex items-center gap-2 text-slate-300 px-6 py-4 rounded-xl font-semibold border border-white/10 hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">play_circle</span>
              Lihat Cara Kerja
            </a>
          </div>
        </div>
      </section>

      {/* ────── KEUNGGULAN ────── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Kenapa SplitBill?</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Bagi tagihan jadi <span className="text-primary">semudah</span> ini
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group bg-surface-dark rounded-2xl p-8 border border-white/5 hover:border-primary/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Scan Otomatis</h3>
              <p className="text-slate-400 leading-relaxed">
                Cukup foto struk belanja, AI langsung mengenali semua item, jumlah, dan harga. Tidak perlu ketik manual satu per satu.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-surface-dark rounded-2xl p-8 border border-white/5 hover:border-primary/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">group</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Assign ke Teman</h3>
              <p className="text-slate-400 leading-relaxed">
                Tinggal tap nama di setiap item — siapa yang pesan apa. Bisa bagi rata atau masing-masing bayar pesanannya sendiri.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-surface-dark rounded-2xl p-8 border border-white/5 hover:border-primary/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">calculate</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Hitung Proporsional</h3>
              <p className="text-slate-400 leading-relaxed">
                Pajak dan service charge dihitung proporsional secara otomatis. Setiap orang bayar sesuai porsinya — adil dan transparan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────── CARA KERJA ────── */}
      <section id="cara-kerja" className="py-20 md:py-28 border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Cara Kerja</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Tiga langkah, <span className="text-primary">selesai!</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6">
                <span className="text-primary text-3xl font-extrabold">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Foto Struk</h3>
              <p className="text-slate-400">
                Ambil foto struk dari kamera atau galeri. AI kami akan membaca dan mengenali seluruh isi struk secara otomatis.
              </p>
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-primary/20" />
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6">
                <span className="text-primary text-3xl font-extrabold">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Pilih Siapa Makan Apa</h3>
              <p className="text-slate-400">
                Tambahkan teman, lalu tap nama mereka di setiap item pesanan. Bisa satu orang, bisa patungan bareng.
              </p>
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-primary/20" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6">
                <span className="text-primary text-3xl font-extrabold">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Bagikan Hasilnya</h3>
              <p className="text-slate-400">
                Lihat ringkasan siapa bayar berapa, lalu bagikan langsung lewat WhatsApp atau salin ke clipboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────── CTA FINAL ────── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-surface-dark rounded-3xl p-10 md:p-16 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <span className="material-symbols-outlined text-primary text-5xl mb-6 block">receipt_long</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Siap bagi tagihan?
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Gratis, tanpa daftar akun, langsung pakai. Foto struk dan bagi ke teman dalam hitungan detik.
              </p>
              <Link
                href="/split-bill"
                className="inline-flex items-center gap-2 bg-primary text-background-dark px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Mulai Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="border-t border-white/5 py-10 px-4 mt-auto">
        <div className="max-w-6xl mx-auto">
          {/* Atas: Logo & Deskripsi */}
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                </div>
                <span className="text-xl font-bold">
                  Split<span className="text-primary">Bill</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Solusi cerdas untuk membagi tagihan bersama teman. Didukung teknologi AI untuk pembacaan struk otomatis.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-2">Tautan</h4>
              <Link href="/split-bill" className="text-slate-400 text-sm hover:text-primary transition-colors">Mulai Split Bill</Link>
              <a href="https://pijarteknologi.id/" target="_blank" rel="noopener noreferrer" className="text-slate-400 text-sm hover:text-primary transition-colors">Pijar Teknologi</a>
            </div>
          </div>

          {/* Bawah: Copyright & Sosmed */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm">© 2026 Pijar Teknologi. All rights reserved.</p>

            <div className="flex items-center gap-6">
              <a href="https://www.linkedin.com/company/pijar-teknologi-indonesia/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/pijarteknologi.id/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@pijarteknologi.id" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
