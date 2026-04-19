import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Scholarship } from '../types/scholarship';

const BATCH_SIZE = 500;

/**
 * Atomically uploads scholarship documents to Firestore.
 * – Uses the scholarship `name` as the document ID to prevent duplicates.
 * – Splits into batches of ≤500 to stay within Firestore limits.
 * – Appends a `createdAt` server timestamp to every document.
 */
export async function migrateScholarships(data: Omit<Scholarship, 'createdAt'>[]): Promise<void> {
  if (data.length === 0) {
    console.warn('migrateScholarships: data array is empty – nothing to write.');
    return;
  }

  const ref = collection(db, 'scholarships');
  let uploaded = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      batch.set(doc(ref), {
        name:         item.name,
        volunteering: item.volunteering,
        military:     item.military,
        periphery:    item.periphery,
        sector:       item.sector,
        field:        item.field,
        amount:       item.amount,
        openingDate:  item.openingDate,
        link:         item.link,
        createdAt:    serverTimestamp(),
      });
    }

    await batch.commit();
    uploaded += chunk.length;
    console.log(`migrateScholarships: ${uploaded}/${data.length} uploaded`);
  }

  console.log('migrateScholarships: done ✓');
}

// ── Scholarship data (sourced from scholarship-wizard/src/data/scholarships.ts) ─
export const SCHOLARSHIP_DATA: Omit<Scholarship, 'createdAt'>[] = [
  { name: 'תן גב', volunteering: 'V', military: '', periphery: '', sector: 'מצוקה/עו"ס', field: 'כללי', amount: '5500', openingDate: 'כל השנה', link: 'https://www.tengav.org.il' },
  { name: 'קרן פסיפס', volunteering: 'V', military: '', periphery: '', sector: 'מצוקה כלכלית', field: 'כללי', amount: 'משתנה', openingDate: 'יולי', link: 'https://www.pessifas.org.il' },
  { name: 'התאחדות הסטודנטים', volunteering: '50 / 200 שעות', military: 'V (מילואים)', periphery: '', sector: 'להט"ב/בע"ח', field: 'משתנה', amount: '12000', openingDate: 'נובמבר', link: 'https://student.org.il' },
  { name: 'מפעל הפיס', volunteering: '', military: '', periphery: 'V (רשויות)', sector: '', field: 'כללי', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.pais.co.il' },
  { name: 'קרן אלרוב', volunteering: 'V', military: 'V', periphery: '', sector: 'דור ראשון', field: 'כללי', amount: '10000', openingDate: 'יוני', link: 'https://alrovfund.org.il' },
  { name: 'פר"ח', volunteering: 'כ 6 שעות שבועיות', military: 'V (מילואים)', periphery: '', sector: '', field: 'כללי', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.perach.org.il' },
  { name: 'מלגת לתת', volunteering: '170 / 250 שעות', military: '', periphery: '', sector: '', field: 'הדרכה', amount: '14000', openingDate: 'אוגוסט', link: 'https://www.latet.org.il' },
  { name: 'מלגפה', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: '6000', openingDate: 'כל השנה', link: 'https://milgapo.co.il' },
  { name: 'מלגת לנובו', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: '6000', openingDate: 'יולי', link: 'https://lenovo-scholarship.co.il' },
  { name: 'מלגת מיל-go', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: '12480', openingDate: 'נובמבר', link: 'https://www.mil-go.org.il' },
  { name: 'פועלים להצלחה', volunteering: '140 שעות', military: '', periphery: 'V (חברתית)', sector: '', field: 'כללי', amount: '10000', openingDate: 'יולי', link: 'https://www.poalim-success.co.il' },
  { name: 'חינוך לפסגות', volunteering: '130-140 שעות', military: '', periphery: '', sector: '', field: 'חינוך', amount: '10000', openingDate: 'אוגוסט', link: 'https://www.e4e.org.il' },
  { name: 'פסגות טק', volunteering: '140 שעות', military: '', periphery: 'V', sector: '', field: 'הנדסה', amount: '10000', openingDate: 'אוגוסט', link: 'https://www.psagot-tech.co.il' },
  { name: 'מנהיגי שוליך', volunteering: 'V', military: 'V (עדיפות)', periphery: '', sector: '', field: 'STEM', amount: '40000', openingDate: 'פברואר', link: 'https://www.schulichleaders.co.il' },
  { name: 'קרן קזז דלאל', volunteering: 'V', military: 'V', periphery: '', sector: '', field: 'רפואה/משפטים', amount: '6000', openingDate: 'יולי', link: 'https://www.kazzaz-dalal.org.il' },
  { name: 'דרך עמ"י', volunteering: '140 שעות', military: '', periphery: '', sector: 'דתי-לאומי', field: 'יהדות', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.derechami.org.il' },
  { name: 'אתנחתא', volunteering: '140 שעות', military: '', periphery: '', sector: 'דתי-לאומי', field: 'יהדות', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.atnachta.org' },
  { name: 'נפש יהודי', volunteering: '138 שעות', military: '', periphery: '', sector: '', field: 'יהדות', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.nefeshyehudi.co.il' },
  { name: 'חבר כלבבי', volunteering: '25 שבועות לאורך השנה', military: '', periphery: 'V (אזורי)', sector: '', field: 'בע"ח', amount: '10000', openingDate: 'יולי', link: 'https://www.haver-kelevavi.org.il' },
  { name: 'תכנית השוברים', volunteering: 'V', military: '', periphery: '', sector: 'אבטלה', field: 'מקצועי', amount: '90% שכ"ל', openingDate: 'כל השנה', link: 'https://www.gov.il' },
  { name: 'מנהיגות עסקית', volunteering: '140 שעות', military: '', periphery: '', sector: '', field: 'תארים מתקדמים', amount: '13000', openingDate: 'אוגוסט', link: 'https://www.bizleaders.co.il' },
  { name: 'כפר הסטודנטים הדר', volunteering: '200 / 340 שעות', military: '', periphery: 'V (חיפה)', sector: '', field: 'חברתי', amount: '21500', openingDate: 'יוני', link: 'https://www.hadar-haifa.org.il' },
  { name: 'מלגת רקיע', volunteering: 'V', military: '', periphery: '', sector: 'צעירי יתד', field: 'כללי', amount: '16000', openingDate: 'אוגוסט', link: 'https://www.rakia-scholarship.org.il' },
  { name: 'לומדים בהכשרה', volunteering: 'V', military: 'V', periphery: 'V (אשכול 1-4)', sector: '', field: 'מקצועי', amount: 'חודשי', openingDate: 'כל השנה', link: 'https://www.gov.il' },
  { name: 'עתידים לתעשייה', volunteering: '60 שעות', military: '', periphery: 'V', sector: '', field: 'הנדסה', amount: 'משתנה', openingDate: 'יולי', link: 'https://atidim.org' },
  { name: 'מלגת אייסף', volunteering: '80 שעות + 15 מפגשים', military: 'V', periphery: '', sector: 'דור ראשון', field: 'כללי', amount: '20000', openingDate: 'יוני', link: 'https://www.isef.org.il' },
  { name: 'מלגת מושל', volunteering: 'V', military: '', periphery: '', sector: 'דור ראשון', field: 'STEM', amount: '15000', openingDate: 'פברואר', link: 'https://MoshalProgram.org' },
  { name: 'קרן אור רייכמן', volunteering: 'V', military: 'V', periphery: '', sector: 'מצוקה כלכלית', field: 'מחשבים', amount: 'מלא', openingDate: 'אפריל', link: 'https://www.runi.ac.il' },
  { name: 'הזנק לעתיד', volunteering: '3 שעות שבועיות + 6 מפגשים', military: '', periphery: 'V (עוטף)', sector: '', field: 'כללי', amount: '10000', openingDate: 'אוגוסט', link: 'https://www.haznak.org.il' },
  { name: 'ייעוד 44', volunteering: 'V', military: 'V', periphery: 'V (מוסד)', sector: '', field: 'כללי', amount: '11653', openingDate: 'ספטמבר', link: 'https://www.hachvana.mod.gov.il' },
  { name: 'עתיד פלוס', volunteering: '155-170 שעות', military: '', periphery: '', sector: '', field: 'כללי', amount: '12000', openingDate: 'יולי', link: 'https://www.atidplus.org.il' },
  { name: 'שגרירי רוטשילד', volunteering: '10 שעות שבועיות', military: '', periphery: '', sector: '', field: 'מנהיגות', amount: '20000', openingDate: 'אפריל', link: 'https://www.rothschild-ambassadors.org.il' },
  { name: 'הזנק להנדסאים', volunteering: 'V', military: '', periphery: 'V (צפון)', sector: 'סכנת נשירה', field: 'הנדסאים', amount: 'מלא', openingDate: 'יולי', link: 'https://www.haznak.org.il' },
  { name: 'כוכבי הצפון', volunteering: 'עשייה בקהילה', military: '', periphery: 'V', sector: '', field: 'רפואה/הנדסה', amount: 'שכ"ל+מחיה', openingDate: 'מאי', link: 'https://www.stars-north.org.il' },
  { name: 'המרכז האזרחי', volunteering: 'V', military: '', periphery: '', sector: '', field: 'רפואה/הנדסה', amount: '5000', openingDate: 'אוגוסט', link: 'https://www.civic-center.org.il' },
  { name: 'מלגת שוות', volunteering: '140 שעות', military: '', periphery: '', sector: 'נשים', field: 'הדרכה', amount: '10000', openingDate: 'יוני', link: 'https://www.she-voot.org.il' },
  { name: 'סייבר כנרת', volunteering: 'V', military: '', periphery: 'V (אשכולות)', sector: 'אתיופיה/מפונים', field: 'סייבר', amount: '8000', openingDate: 'אוגוסט', link: 'https://www.kinneret.ac.il' },
  { name: 'מינהל הסטודנטים', volunteering: '80/120 שעות', military: '', periphery: '', sector: 'עולים', field: 'כללי', amount: 'מלא', openingDate: 'כל השנה', link: 'https://www.gov.il' },
  { name: 'עמיתי מעשה', volunteering: 'V', military: '', periphery: 'V (י-ם)', sector: 'נזקקות', field: 'כללי', amount: '15000', openingDate: 'אוגוסט', link: 'https://www.maase.org.il' },
  { name: 'עתידים עתודאים', volunteering: '?', military: '', periphery: 'V', sector: '', field: 'הנדסה', amount: '10500', openingDate: 'אוגוסט', link: 'https://atidim.org' },
  { name: 'פרויקט הכוון - ע"ש אהרן שנדור', volunteering: '60 שעות', military: 'V', periphery: '', sector: 'ללא עורף', field: 'כללי', amount: '80% שכ"ל', openingDate: 'אוגוסט', link: 'https://www.sandor.org.il' },
  { name: 'ממדים ללימודים', volunteering: 'V', military: 'V (לוחמים)', periphery: '', sector: '', field: 'כללי', amount: 'מלא', openingDate: 'כל השנה', link: 'https://www.hachvana.mod.gov.il' },
  { name: 'מלגת אימפקט', volunteering: '130 שעות', military: 'V (לוחם/תומכ"ל)', periphery: '', sector: '', field: 'כללי', amount: '$5000', openingDate: 'פברואר', link: 'https://www.fidf.org' },
  { name: 'קרן גרוס', volunteering: '80 שעות', military: 'V', periphery: 'V', sector: 'חרדים/אתיופיה', field: 'כללי', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.grossfoundation.org.il' },
  { name: 'קרן מכבים', volunteering: 'V', military: 'V', periphery: '', sector: '', field: 'בריאות', amount: '3000', openingDate: 'יולי', link: 'https://www.maccabim-foundation.org.il' },
  { name: 'בשביל החיים ע"ש אלי כהן', volunteering: 'V', military: '', periphery: '', sector: '', field: 'מחקר אבדנות', amount: '5000', openingDate: 'יוני', link: 'https://www.pathstolife.org.il' },
  { name: 'קיום משפיעים בלימודים', volunteering: '90 שעות + 10 שעות הכשרה', military: 'V (לוחמים)', periphery: '', sector: 'בודדים/עולים', field: 'כללי', amount: '18000', openingDate: 'פברואר', link: 'https://www.impact-kium.org.il' },
  { name: 'מלגת המילואים', volunteering: 'בכל מוסד פרטים', military: 'שירות צה"ל/לאומי', periphery: '', sector: '', field: '', amount: '', openingDate: '', link: '' },
  { name: 'ייעוד 45 / 46', volunteering: 'V', military: 'V', periphery: 'V (מגורים)', sector: '', field: 'כללי', amount: '11653', openingDate: 'ספטמבר', link: 'https://www.hachvana.mod.gov.il' },
  { name: 'חיילים בודדים במילואים (60 ימי מילואים בחרבות ברזל)', volunteering: '60 ימי מילואים', military: 'הוגדרו כחיילים בודדים בשירות חובה', periphery: '', sector: '', field: '', amount: '', openingDate: '', link: '' },
  { name: 'קרן הישג', volunteering: '130 שעות', military: '', periphery: '', sector: 'חיילים בודדים', field: 'כללי', amount: 'מלא', openingDate: 'מאי', link: 'https://www.hachshara.org.il' },
  { name: 'הזנק מרכנתיל', volunteering: '50 שעות', military: '', periphery: '', sector: 'חברה ערבית', field: 'כללי', amount: 'מלא', openingDate: 'יולי', link: 'https://www.haznak.org.il' },
  { name: 'סלים שופי - הקרן לידידות', volunteering: '100 שעות', military: 'V', periphery: '', sector: 'ערבים/דרוזים', field: 'כללי', amount: '10000', openingDate: 'אוגוסט', link: 'https://www.shofi.org.il' },
  { name: 'מלגת אירתקא למגזר הערבי', volunteering: '40 שעות בשנה א, 80 שעות בשנה ב, 80 שעות ב-ג, 80 שעות ב-ד', military: '', periphery: '', sector: 'חברה ערבית', field: 'כללי', amount: '36000', openingDate: 'אוקטובר', link: 'https://www.irtaka.org.il' },
  { name: 'מדברים ערבית', volunteering: '?', military: '', periphery: '', sector: 'דוברי ערבית', field: 'הדרכה', amount: '7000', openingDate: 'אוקטובר', link: 'https://www.gov.il' },
  { name: 'מלגת עתידנא', volunteering: '?', military: '', periphery: '', sector: 'חברה ערבית', field: 'הובלת נוער', amount: '5000', openingDate: 'ספטמבר', link: 'https://www.atidna.co.il' },
  { name: 'בני מערוף לדרוזים', volunteering: 'V', military: '', periphery: '', sector: 'דרוזים', field: 'הנדסה', amount: 'משתנה', openingDate: 'ספטמבר', link: 'https://www.druze-foundation.org.il' },
  { name: 'מופיד עאמר', volunteering: '50 שעות', military: 'V', periphery: '', sector: 'דרוזים', field: 'כללי', amount: 'משתנה', openingDate: 'ספטמבר', link: 'https://www.druze-foundation.org.il' },
  { name: 'מלגת מרום ליוצאי אתיופיה', volunteering: '40 שעות בשנה א, 60 שעות בשנה ב+ג', military: '', periphery: '', sector: 'אתיופיה', field: 'מקצועות נדרשים', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.gov.il' },
  { name: 'חנן עינור ליוצאי אתיופיה', volunteering: 'V', military: '', periphery: '', sector: 'אתיופיה', field: 'כללי', amount: 'משתנה', openingDate: 'יולי', link: 'https://www.hananeinor.org.il' },
  { name: 'לעולים חדשים - HIAS', volunteering: 'V', military: '', periphery: '', sector: 'עולים', field: 'כללי', amount: '$2500', openingDate: 'נובמבר', link: 'https://www.hias.org.il' },
  { name: 'אמץ סטודנט', volunteering: 'V', military: '', periphery: '', sector: 'אתיופיה', field: 'כללי', amount: '5000', openingDate: 'אוגוסט', link: 'https://www.nacoej.org.il' },
  { name: 'מטרוטק', volunteering: '?', military: '', periphery: '', sector: 'חרדים', field: 'הייטק', amount: 'מלא+3000', openingDate: 'יוני', link: 'https://www.metrotech.org.il' },
  { name: 'אורות אלירז', volunteering: '140 שעות + שבתות ועוד', military: 'V', periphery: 'V (י-ם)', sector: 'דתי-לאומי', field: 'כללי', amount: '10000', openingDate: 'ספטמבר', link: 'https://www.eliraz.org.il' },
  { name: 'קרן טנא', volunteering: 'V', military: '', periphery: '', sector: 'חרדים', field: 'כללי', amount: '9800', openingDate: 'ספטמבר', link: 'https://www.tenefund.org.il' },
  { name: 'אור יוסף', volunteering: 'V', military: '', periphery: '', sector: 'חרדים', field: 'בריאות', amount: '7000', openingDate: 'אוקטובר', link: 'https://www.kamach.org.il' },
  { name: 'מלגת לדרך', volunteering: 'V', military: '', periphery: '', sector: 'חרדים', field: 'ניהול', amount: '7000', openingDate: 'אוקטובר', link: 'https://www.kamach.org.il' },
  { name: 'תכנית שקד', volunteering: 'V', military: '', periphery: '', sector: 'חרדים', field: 'כללי', amount: '7000', openingDate: 'אוקטובר', link: 'https://www.kamach.org.il' },
  { name: 'מלגת שברון', volunteering: '', military: '', periphery: 'V (תל חי)', sector: '', field: 'חינוך', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.telhai.ac.il' },
  { name: 'רוטשילד-קיסריה', volunteering: '', military: '', periphery: '', sector: '', field: 'כללי', amount: '15000', openingDate: 'אפריל', link: 'https://www.rothschild-caesarea.org.il' },
  { name: 'קרן אסיף', volunteering: '', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'ספטמבר', link: 'https://www.assiffund.org.il' },
  { name: 'מלגת הומניטס', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: '10000', openingDate: 'יולי', link: 'https://www.humanitas.org.il' },
  { name: 'קרן קולורדו', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.colorado-foundation.org.il' },
  { name: 'בני ברית', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.bnaibrith.org.il' },
  { name: 'קרן הדר', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.hadarfoundation.org.il' },
  { name: 'המועצה להשכלה גבוהה', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'נובמבר', link: 'https://www.che.org.il' },
  { name: 'מלגות המוסד הלימודי', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'כל השנה', link: 'אתר המוסד' },
  { name: 'התאחדות הסטודנטים (כללי)', volunteering: '', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'נובמבר', link: 'https://student.org.il' },
  { name: 'הקרן לחיילים משוחררים', volunteering: 'V', military: 'V', periphery: 'V', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'כל השנה', link: 'https://www.hachvana.mod.gov.il' },
  { name: 'קרן דורין', volunteering: '', military: '', periphery: '', sector: '', field: 'אמנות', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.dorin-foundation.org.il' },
  { name: 'קרן וולף', volunteering: 'V', military: '', periphery: '', sector: 'מצוינות', field: 'מדעים', amount: 'משתנה', openingDate: 'דצמבר', link: 'https://www.wolffund.org.il' },
  { name: 'המועצה הדתית י-ם', volunteering: 'V', military: '', periphery: 'V (י-ם)', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוקטובר', link: 'אתר המועצה' },
  { name: 'קרן שלם', volunteering: 'V', military: '', periphery: '', sector: 'מוגבלויות', field: 'עו"ס', amount: '5000', openingDate: 'אוגוסט', link: 'https://www.kshalem.org.il' },
  { name: 'קרן רש"י', volunteering: '', military: '', periphery: 'V', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'ספטמבר', link: 'https://www.rashi.org.il' },
  { name: "מלגת ג'ינייס", volunteering: '', military: '', periphery: '', sector: '', field: 'טכנולוגיה', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.gnius.org.il' },
  { name: 'סטודנטים למען הקהילה', volunteering: '', military: '', periphery: '', sector: '', field: 'חברתי', amount: '10000', openingDate: 'ספטמבר', link: 'אתר הרשות' },
  { name: 'מצוינות בפריפריה', volunteering: '', military: '', periphery: 'V', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'נובמבר', link: 'https://www.che.org.il' },
  { name: 'מעורבות חברתית דיקן', volunteering: '', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'ספטמבר', link: 'אתר המוסד' },
  { name: 'סיוע כלכלי דיקן', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'כל השנה', link: 'אתר המוסד' },
  { name: 'מנהיגות פוליטית', volunteering: '', military: '', periphery: '', sector: '', field: 'מדעי המדינה', amount: '10000', openingDate: 'אוגוסט', link: 'https://www.polileaders.org.il' },
  { name: 'קרן גנדי', volunteering: '', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'ינואר', link: 'https://www.rehavm-zeevi.org.il' },
  { name: 'יד ושם', volunteering: 'V', military: '', periphery: '', sector: '', field: 'היסטוריה', amount: 'משתנה', openingDate: 'מאי', link: 'https://www.yadvashem.org' },
  { name: 'קרן חל"ד', volunteering: 'V', military: '', periphery: '', sector: '', field: 'חינוך', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.cheled.org.il' },
  { name: 'קרן אפריים', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'ספטמבר', link: 'https://www.ephraim-fund.org.il' },
  { name: 'קרן יק"א', volunteering: 'V', military: '', periphery: 'V', sector: '', field: 'חקלאות', amount: 'משתנה', openingDate: 'יולי', link: 'https://www.ica-israel.org.il' },
  { name: 'קרן סמי עופר', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.sammyofer.org.il' },
  { name: 'קרן אייזנברג', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.eisenberg.org.il' },
  { name: 'קרן טראמפ', volunteering: 'V', military: '', periphery: '', sector: '', field: 'חינוך', amount: '10000', openingDate: 'יוני', link: 'https://www.trump.org.il' },
  { name: 'קרן לאוטמן', volunteering: '', military: '', periphery: '', sector: '', field: 'חינוך', amount: 'משתנה', openingDate: 'יולי', link: 'https://www.lautman.org.il' },
  { name: 'פרידריך אברט', volunteering: '', military: '', periphery: '', sector: '', field: 'חברה', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.fes.org.il' },
  { name: 'הנס זיידל', volunteering: '', military: '', periphery: '', sector: '', field: 'מנהל ציבורי', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.hss.org.il' },
  { name: 'רוזה לוקסמבורג', volunteering: '', military: '', periphery: '', sector: '', field: 'חברה', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.rosalux.org.il' },
  { name: 'קונרד אדנאואר', volunteering: '', military: '', periphery: '', sector: '', field: 'פוליטיקה', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.kas.de' },
  { name: 'היינריך בל', volunteering: '', military: '', periphery: '', sector: '', field: 'סביבה', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.il.boell.org' },
  { name: 'קרן לגאסי', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.legacy-fund.org.il' },
  { name: "קרן צ'ייס", volunteering: '', military: '', periphery: '', sector: '', field: 'מדעי הרוח', amount: 'משתנה', openingDate: 'מאי', link: 'https://www.chase.org.il' },
  { name: 'קרן מנדל', volunteering: '', military: '', periphery: '', sector: '', field: 'מנהיגות', amount: 'משתנה', openingDate: 'יולי', link: 'https://www.mandelfoundation.org.il' },
  { name: 'קרן פוזן', volunteering: '', military: '', periphery: '', sector: '', field: 'יהדות', amount: 'משתנה', openingDate: 'יוני', link: 'https://www.posenfnd.org' },
  { name: 'פולברייט', volunteering: 'V', military: '', periphery: '', sector: '', field: 'מחקר', amount: 'משתנה', openingDate: 'מאי', link: 'https://www.fulbright.org.il' },
  { name: "קרן הות'ורן", volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.hawthorne.org.il' },
  { name: 'קרן פלאטו שרון', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'יולי', link: 'https://www.flatto.org.il' },
  { name: 'קרן ספרא', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.safra.org.il' },
  { name: 'קרן וינברג', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.weinberg.org.il' },
  { name: 'קרן קורת', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.koret.org.il' },
  { name: 'קרן הריס', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.harris.org.il' },
  { name: 'קרן קירש', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.kirsh.org.il' },
  { name: 'קרן נתניהו', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוגוסט', link: 'https://www.netanyahu-fund.org.il' },
  { name: 'קרן דן דוד', volunteering: 'V', military: '', periphery: '', sector: '', field: 'היסטוריה', amount: 'משתנה', openingDate: 'דצמבר', link: 'https://www.dandavidprize.org' },
  { name: 'מלגות הצטיינות משרד החינוך', volunteering: 'V', military: '', periphery: '', sector: '', field: 'כללי', amount: 'משתנה', openingDate: 'אוקטובר', link: 'אתר משרד החינוך' },
];
