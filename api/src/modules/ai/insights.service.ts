import { Injectable } from '@nestjs/common';
import type { NutritionTargets } from '@nutrilens/shared';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from '../../common/locales';

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/**
 * Server-side insight strings, indexed by locale.
 *
 * We localize on the server (rather than emitting a key for the client to
 * translate) because:
 *   - the dashboard DTO has been `insight: string | null` since v1; clients
 *     that don't update will keep working,
 *   - the weekly/monthly variants embed numbers (`missedDays`, `daysTracked`,
 *     `averageCalories`) using the locale's grouping conventions, which is
 *     less brittle than ICU plural strings shipped to the client.
 *
 * If you add a new locale, add it here too — TypeScript flags any missing
 * variant via the `Record<SupportedLocale, …>` shape.
 */
const DAILY_MESSAGES: Record<SupportedLocale, Record<string, string>> = {
  en: {
    noMeals: 'No meals logged yet today. Snap a photo of your next meal to get started.',
    fiberLow: 'Fiber is low today. Adding fruit, vegetables, or legumes may help.',
    proteinLow:
      'Calories are on track but protein is low. A protein-rich snack could balance the day.',
    over: 'You are slightly over your calorie target. Lighter meals tomorrow can balance the week.',
    onTrack: 'You are close to your calorie target and protein is on track.',
    good: 'Tracking is going well. Keep it up.',
  },
  tr: {
    noMeals: 'Bugün henüz öğün eklemedin. Bir sonraki öğünün fotoğrafını çekerek başla.',
    fiberLow: 'Bugün lif düşük. Meyve, sebze veya baklagiller eklemek faydalı olabilir.',
    proteinLow:
      'Kaloriler iyi gidiyor ama protein düşük. Protein yoğun bir atıştırmalık günü dengeleyebilir.',
    over: 'Kalori hedefini biraz aştın. Yarın daha hafif öğünler haftayı dengeler.',
    onTrack: 'Kalori hedefine yakınsın ve protein de yolunda.',
    good: 'Takip iyi gidiyor. Böyle devam et.',
  },
  es: {
    noMeals: 'Hoy aún no has registrado comidas. Captura una foto de tu próxima comida.',
    fiberLow: 'La fibra está baja hoy. Añadir fruta, verduras o legumbres puede ayudar.',
    proteinLow:
      'Las calorías van bien pero la proteína está baja. Un snack rico en proteínas equilibraría el día.',
    over: 'Estás algo por encima de tu objetivo de calorías. Comidas más ligeras mañana equilibran la semana.',
    onTrack: 'Estás cerca de tu objetivo de calorías y la proteína va bien.',
    good: 'El seguimiento va bien. Sigue así.',
  },
  fr: {
    noMeals: 'Aucun repas enregistré aujourd’hui. Prends une photo de ton prochain repas pour commencer.',
    fiberLow: 'Les fibres sont basses aujourd’hui. Ajouter des fruits, des légumes ou des légumineuses peut aider.',
    proteinLow:
      'Les calories sont bonnes mais les protéines sont basses. Un en-cas riche en protéines équilibrerait la journée.',
    over: 'Tu es légèrement au-dessus de ton objectif calorique. Des repas plus légers demain équilibrent la semaine.',
    onTrack: 'Tu es proche de ton objectif calorique et les protéines suivent.',
    good: 'Le suivi se passe bien. Continue comme ça.',
  },
  it: {
    noMeals: 'Oggi non hai ancora registrato pasti. Scatta una foto del prossimo pasto per iniziare.',
    fiberLow: 'Le fibre sono basse oggi. Aggiungere frutta, verdura o legumi può aiutare.',
    proteinLow:
      'Le calorie sono in linea ma le proteine sono basse. Uno spuntino proteico bilancerebbe la giornata.',
    over: 'Sei leggermente sopra l’obiettivo calorico. Pasti più leggeri domani bilanciano la settimana.',
    onTrack: 'Sei vicino all’obiettivo calorico e le proteine sono in linea.',
    good: 'Il monitoraggio sta andando bene. Continua così.',
  },
  de: {
    noMeals: 'Heute noch keine Mahlzeit erfasst. Mach ein Foto deiner nächsten Mahlzeit, um zu starten.',
    fiberLow: 'Die Ballaststoffe sind heute niedrig. Obst, Gemüse oder Hülsenfrüchte können helfen.',
    proteinLow:
      'Kalorien sind im Plan, aber das Eiweiß ist niedrig. Ein eiweißreicher Snack würde den Tag ausgleichen.',
    over: 'Du liegst leicht über deinem Kalorienziel. Leichtere Mahlzeiten morgen gleichen die Woche aus.',
    onTrack: 'Du bist nah an deinem Kalorienziel und das Eiweiß ist im Plan.',
    good: 'Das Tracking läuft gut. Weiter so.',
  },
  pt: {
    noMeals: 'Nenhuma refeição registrada hoje. Tire uma foto da próxima refeição para começar.',
    fiberLow: 'A fibra está baixa hoje. Adicionar frutas, vegetais ou leguminosas pode ajudar.',
    proteinLow:
      'As calorias estão no caminho, mas a proteína está baixa. Um lanche rico em proteínas equilibraria o dia.',
    over: 'Você está um pouco acima da meta de calorias. Refeições mais leves amanhã equilibram a semana.',
    onTrack: 'Você está perto da meta de calorias e a proteína está em dia.',
    good: 'O acompanhamento está indo bem. Continue assim.',
  },
  ar: {
    noMeals: 'لم تُسجَّل وجبات اليوم بعد. التقط صورة لوجبتك التالية للبدء.',
    fiberLow: 'الألياف منخفضة اليوم. إضافة فاكهة أو خضار أو بقوليات قد تساعد.',
    proteinLow:
      'السعرات في المسار لكن البروتين منخفض. وجبة خفيفة غنية بالبروتين قد توازن اليوم.',
    over: 'أنت تتجاوز هدف السعرات قليلاً. وجبات أخف غدًا توازن الأسبوع.',
    onTrack: 'أنت قريب من هدف السعرات والبروتين على المسار.',
    good: 'التتبع يسير بشكل جيد. استمر.',
  },
  ja: {
    noMeals: '本日まだ食事が記録されていません。次の食事の写真を撮って始めましょう。',
    fiberLow: '今日は食物繊維が少なめです。果物、野菜、豆類を加えると改善できます。',
    proteinLow:
      'カロリーは順調ですが、たんぱく質が不足気味です。高たんぱくな間食でバランスを整えましょう。',
    over: 'カロリー目標をわずかに超えています。明日は軽めの食事で週全体を調整しましょう。',
    onTrack: 'カロリー目標に近く、たんぱく質も順調です。',
    good: '記録は順調です。この調子で続けましょう。',
  },
  zh: {
    noMeals: '今天还未记录餐饮。拍下下一餐的照片即可开始。',
    fiberLow: '今天纤维偏低。添加水果、蔬菜或豆类可能有帮助。',
    proteinLow:
      '热量基本达标，但蛋白质偏低。来一份高蛋白零食可以平衡今天的摄入。',
    over: '热量略超目标。明天来点更清淡的餐食可以平衡整周。',
    onTrack: '热量接近目标，蛋白质也在轨道上。',
    good: '记录进展不错。继续保持。',
  },
};

@Injectable()
export class InsightsService {
  daily(totals: DailyTotals, targets: NutritionTargets, locale?: string): string | null {
    const messages = DAILY_MESSAGES[this.normalize(locale)];
    if (totals.calories === 0) return messages.noMeals;

    const calorieRatio = totals.calories / targets.dailyCalories;
    const proteinRatio = totals.protein / targets.proteinGrams;
    const fiberRatio = totals.fiber / targets.fiberGrams;

    if (fiberRatio < 0.5) return messages.fiberLow;
    if (proteinRatio < 0.6 && calorieRatio > 0.6) return messages.proteinLow;
    if (calorieRatio > 1.1) return messages.over;
    if (calorieRatio >= 0.85 && calorieRatio <= 1.05 && proteinRatio >= 0.85) {
      return messages.onTrack;
    }
    return messages.good;
  }

  weekly(args: {
    averageCalories: number;
    proteinTargetHitDays: number;
    missedDays: number;
    targets: NutritionTargets;
    locale?: string;
  }): string {
    const { averageCalories, proteinTargetHitDays, missedDays, targets } = args;
    const locale = this.normalize(args.locale);
    const fmt = new Intl.NumberFormat(locale);

    if (missedDays >= 4) {
      return this.weeklyMissed(locale, missedDays);
    }
    if (proteinTargetHitDays >= 5) {
      return this.weeklyProteinStrong(locale, proteinTargetHitDays);
    }
    if (averageCalories < targets.dailyCalories * 0.7) {
      return this.weeklyBelowTarget(locale);
    }
    return this.weeklyProteinPartial(locale, proteinTargetHitDays);
  }

  monthly(args: { daysTracked: number; averageCalories: number; locale?: string }): string {
    const { daysTracked, averageCalories } = args;
    const locale = this.normalize(args.locale);
    const fmt = new Intl.NumberFormat(locale);

    if (daysTracked < 5) return this.monthlyShort(locale);
    return this.monthlyTracked(locale, daysTracked, fmt.format(Math.round(averageCalories)));
  }

  private normalize(locale?: string): SupportedLocale {
    return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  }

  // The weekly/monthly templates take 1-2 numeric arguments. Rather than ship
  // a full ICU formatter for these, we hand-roll the templates per locale.
  private weeklyMissed(locale: SupportedLocale, days: number): string {
    const t: Record<SupportedLocale, string> = {
      en: `You missed tracking on ${days} days. Even a short photo log helps the picture.`,
      tr: `${days} günü kaçırdın. Kısa bir fotoğraf kaydı bile resmi tamamlar.`,
      es: `No registraste ${days} días. Incluso un breve registro fotográfico ayuda.`,
      fr: `Tu as manqué le suivi pendant ${days} jours. Même une courte photo aide.`,
      it: `Hai saltato il monitoraggio per ${days} giorni. Anche una foto breve aiuta.`,
      de: `Du hast an ${days} Tagen kein Tracking gemacht. Schon ein kurzes Foto-Log hilft.`,
      pt: `Você não registrou em ${days} dias. Até um registro curto por foto ajuda.`,
      ar: `فاتك التتبّع في ${days} أيام. حتى تسجيل قصير بالصور يساعد.`,
      ja: `${days}日間の記録が抜けています。短い写真ログでも全体像が見えます。`,
      zh: `你有 ${days} 天未记录。即使简短的照片记录也有帮助。`,
    };
    return t[locale];
  }

  private weeklyProteinStrong(locale: SupportedLocale, hits: number): string {
    const t: Record<SupportedLocale, string> = {
      en: `Strong week — you hit your protein target on ${hits} of 7 days.`,
      tr: `İyi bir hafta — protein hedefini 7 günün ${hits} gününde tutturdun.`,
      es: `Semana sólida — alcanzaste tu objetivo de proteína ${hits} de 7 días.`,
      fr: `Semaine solide — tu as atteint ton objectif de protéines ${hits} jours sur 7.`,
      it: `Settimana solida — hai centrato l’obiettivo proteico ${hits} giorni su 7.`,
      de: `Starke Woche — du hast dein Eiweißziel an ${hits} von 7 Tagen erreicht.`,
      pt: `Semana forte — você atingiu a meta de proteína em ${hits} de 7 dias.`,
      ar: `أسبوع قوي — حقّقت هدف البروتين في ${hits} من 7 أيام.`,
      ja: `好調な週です — 7日中${hits}日でたんぱく質目標を達成しました。`,
      zh: `表现出色 — 7 天中有 ${hits} 天达成蛋白质目标。`,
    };
    return t[locale];
  }

  private weeklyBelowTarget(locale: SupportedLocale): string {
    const t: Record<SupportedLocale, string> = {
      en: 'Average intake is well below your target. Make sure you are logging full meals.',
      tr: 'Ortalama alım hedefinin oldukça altında. Tam öğünleri kaydettiğinden emin ol.',
      es: 'La ingesta media está bastante por debajo del objetivo. Asegúrate de registrar las comidas completas.',
      fr: 'Ton apport moyen est bien en dessous de ton objectif. Vérifie que tu enregistres les repas complets.',
      it: 'L’apporto medio è ben al di sotto dell’obiettivo. Assicurati di registrare i pasti completi.',
      de: 'Die durchschnittliche Aufnahme liegt deutlich unter deinem Ziel. Achte darauf, vollständige Mahlzeiten zu erfassen.',
      pt: 'A ingestão média está bem abaixo da meta. Verifique se você está registrando refeições completas.',
      ar: 'متوسط الاستهلاك أقل بكثير من هدفك. تأكد من تسجيل الوجبات الكاملة.',
      ja: '平均摂取量が目標を大きく下回っています。完全な食事を記録しているか確認してください。',
      zh: '平均摄入量明显低于目标。请确保完整记录每一餐。',
    };
    return t[locale];
  }

  private weeklyProteinPartial(locale: SupportedLocale, hits: number): string {
    const t: Record<SupportedLocale, string> = {
      en: `You hit your protein target ${hits}/7 days. Aim for ≥5 next week.`,
      tr: `Protein hedefini ${hits}/7 gün tutturdun. Önümüzdeki hafta ≥5 gün hedefle.`,
      es: `Alcanzaste tu objetivo de proteína ${hits}/7 días. Apunta a ≥5 la próxima semana.`,
      fr: `Tu as atteint ton objectif de protéines ${hits}/7 jours. Vise ≥5 la semaine prochaine.`,
      it: `Hai centrato l’obiettivo proteico ${hits}/7 giorni. Punta a ≥5 la prossima settimana.`,
      de: `Du hast dein Eiweißziel an ${hits}/7 Tagen erreicht. Ziel für nächste Woche: ≥5.`,
      pt: `Você atingiu a meta de proteína ${hits}/7 dias. Mire em ≥5 na próxima semana.`,
      ar: `حقّقت هدف البروتين في ${hits}/7 أيام. استهدف ≥5 الأسبوع المقبل.`,
      ja: `たんぱく質目標を${hits}/7日達成しました。来週は≥5日を目指しましょう。`,
      zh: `本周有 ${hits}/7 天达成蛋白质目标。下周争取 ≥5 天。`,
    };
    return t[locale];
  }

  private monthlyShort(locale: SupportedLocale): string {
    const t: Record<SupportedLocale, string> = {
      en: 'Not much data this month yet. Logging at least 3 meals a day produces better insights.',
      tr: 'Bu ay henüz fazla veri yok. Günde en az 3 öğün kaydetmek daha iyi içgörü verir.',
      es: 'Aún hay pocos datos este mes. Registrar al menos 3 comidas al día mejora los insights.',
      fr: 'Peu de données ce mois-ci. Enregistrer au moins 3 repas par jour donne de meilleurs insights.',
      it: 'Pochi dati questo mese. Registrare almeno 3 pasti al giorno migliora gli insight.',
      de: 'Noch wenig Daten diesen Monat. Mindestens 3 Mahlzeiten täglich liefern bessere Insights.',
      pt: 'Poucos dados neste mês. Registrar ao menos 3 refeições por dia melhora os insights.',
      ar: 'بيانات قليلة هذا الشهر. تسجيل 3 وجبات يوميًا على الأقل يعطي رؤى أفضل.',
      ja: '今月はまだデータが少なめです。1日3食以上記録するとより良い洞察が得られます。',
      zh: '本月数据较少。每天至少记录 3 餐可以获得更好的洞察。',
    };
    return t[locale];
  }

  private monthlyTracked(locale: SupportedLocale, days: number, kcal: string): string {
    const t: Record<SupportedLocale, string> = {
      en: `You tracked ${days} days this month, averaging ${kcal} kcal/day.`,
      tr: `Bu ay ${days} gün kayıt tuttun, günde ortalama ${kcal} kcal.`,
      es: `Registraste ${days} días este mes, con un promedio de ${kcal} kcal/día.`,
      fr: `Tu as suivi ${days} jours ce mois-ci, soit ${kcal} kcal/jour en moyenne.`,
      it: `Hai monitorato ${days} giorni questo mese, con una media di ${kcal} kcal/giorno.`,
      de: `Du hast diesen Monat ${days} Tage erfasst, im Schnitt ${kcal} kcal/Tag.`,
      pt: `Você registrou ${days} dias neste mês, com média de ${kcal} kcal/dia.`,
      ar: `سجّلت ${days} يومًا هذا الشهر بمتوسط ${kcal} سعرة/يوم.`,
      ja: `今月は${days}日間記録、1日平均${kcal} kcalです。`,
      zh: `本月记录了 ${days} 天，平均每天 ${kcal} 千卡。`,
    };
    return t[locale];
  }
}
