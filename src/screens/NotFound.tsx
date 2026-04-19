import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white flex items-center justify-center px-6"
      style={{ fontFamily: "'Heebo', sans-serif" }}
    >
      <div className="text-center max-w-xl">

        {/* Title */}
        <h1
          className="font-black text-4xl md:text-5xl mb-5 leading-tight"
          style={{ color: '#003f87' }}
        >
          אופס! הדף שחיפשת לא נמצא
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg leading-relaxed mb-10" style={{ color: '#424752' }}>
          נראה שהקישור שבור או שהדף הוסר מהמערכת. אל דאגה,
          <br />
          המלגה שלך עדיין מחכה לך במרכז הבקשות.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">

          {/* Primary — חזרה לדף הבית */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#003f87' }}
          >
            <span className="material-symbols-outlined text-xl">home</span>
            חזרה לדף הבית
          </Link>

          {/* Secondary — דיווח על תקלה */}
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-colors"
            style={{
              backgroundColor: '#e7e8e9',
              color: '#424752',
            }}
            onClick={() => window.location.href = 'mailto:support@tzir-latzair.co.il'}
          >
            <span className="material-symbols-outlined text-xl">flag</span>
            דיווח על תקלה
          </button>

        </div>
      </div>
    </div>
  );
}
