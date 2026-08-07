import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { ProposalContext } from '../types';
import { styles, RED, DARK, WHITE } from './styles';
import { WHY_CHINABRIDGE, COOPERATION_STEPS, CONTACTS } from '../sections';

// ─── Sub-components ───────────────────────────────────────────────

function CoverPage({ ctx }: { ctx: ProposalContext }) {
  const dateStr = new Date(ctx.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Page size="A4" style={styles.coverPage}>
      {/* Red header */}
      <View style={styles.coverHeader}>
        <Text style={styles.coverLogoText}>ChinaBridge</Text>
        <Text style={styles.coverLogoSub}>Логистика из Китая под ключ</Text>
      </View>

      {/* Body */}
      <View style={styles.coverBody}>
        <Text style={styles.coverTitle}>ПРЕДВАРИТЕЛЬНЫЙ{'\n'}РАСЧЕТ ПОСТАВКИ</Text>
        <Text style={styles.coverSubtitle}>{ctx.template.title}</Text>

        {/* Meta block */}
        <View style={styles.coverMeta}>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Номер документа</Text>
            <Text style={styles.coverMetaValue}>{ctx.number}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Дата подготовки</Text>
            <Text style={styles.coverMetaValue}>{dateStr}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Тип расчета</Text>
            <Text style={styles.coverMetaValue}>{ctx.mode}</Text>
          </View>
          {ctx.lead.service && (
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Услуга</Text>
              <Text style={styles.coverMetaValue}>{ctx.lead.service}</Text>
            </View>
          )}
        </View>

        {/* Client name */}
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          Подготовлено для:
        </Text>
        <Text style={styles.coverClientName}>
          {ctx.lead.name || 'Клиент'}
          {ctx.lead.company ? `\n${ctx.lead.company}` : ''}
        </Text>

        {/* Mode badge */}
        <View style={styles.coverModeBadge}>
          <Text style={styles.coverModeBadgeText}>{ctx.mode} PROPOSAL</Text>
        </View>
      </View>

      {/* Footer note */}
      <Text style={[styles.footerText, { color: 'rgba(255,255,255,0.3)' }]}>
        Данный документ носит предварительный характер. Итоговая стоимость согласовывается индивидуально.
      </Text>
    </Page>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ClientSection({ ctx }: { ctx: ProposalContext }) {
  const { lead } = ctx;
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Имя', value: lead.name },
    { label: 'Компания', value: lead.company },
    { label: 'Телефон', value: lead.phone },
    { label: 'Telegram', value: lead.telegram },
    { label: 'Email', value: lead.email },
  ].filter(f => Boolean(f.value));

  if (fields.length === 0) return null;
  return (
    <View>
      <SectionHeader title="Информация о клиенте" />
      <View style={styles.infoGrid}>
        {fields.map((f) => (
          <View key={f.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{f.label}</Text>
            <Text style={styles.infoValue}>{f.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CargoSection({ ctx }: { ctx: ProposalContext }) {
  const { lead } = ctx;
  const route = lead.fromCity
    ? `${lead.fromCity} → ${lead.toCity || lead.countryDestination}`
    : lead.toCity || lead.countryDestination;

  const fields: Array<{ label: string; value: string }> = [
    { label: 'Товар', value: lead.product },
    { label: 'Категория', value: lead.category },
    { label: 'Ссылка', value: lead.productLink },
    { label: 'Количество', value: lead.quantity },
    { label: 'Вес', value: lead.weight ? `${lead.weight} кг` : '' },
    { label: 'Объём', value: lead.volume ? `${lead.volume} м³` : '' },
    { label: 'Маршрут', value: route },
    { label: 'Услуга', value: lead.service },
  ].filter(f => Boolean(f.value));

  if (fields.length === 0) return null;
  return (
    <View>
      <SectionHeader title="Параметры груза и маршрут" />
      <View style={styles.infoGrid}>
        {fields.map((f) => (
          <View key={f.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{f.label}</Text>
            <Text style={styles.infoValue}>{f.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SolutionSection({ ctx, brief }: { ctx: ProposalContext; brief?: boolean }) {
  const { template } = ctx;
  const paragraphs = template.description
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);
  const displayParagraphs = brief ? paragraphs.slice(0, 2) : paragraphs;

  return (
    <View>
      <SectionHeader title={`Решение: ${template.title}`} />
      {displayParagraphs.map((p, i) => (
        <Text key={i} style={styles.bodyText}>{p}</Text>
      ))}
    </View>
  );
}

function BenefitsSection({ ctx }: { ctx: ProposalContext }) {
  const { template } = ctx;
  if (!template.benefits.length) return null;
  return (
    <View>
      <SectionHeader title="Преимущества для вас" />
      {template.benefits.map((b, i) => (
        <View key={i} style={styles.benefitRow}>
          <Text style={styles.benefitCheck}>✓</Text>
          <Text style={styles.benefitText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function AssessmentSection({ ctx }: { ctx: ProposalContext }) {
  return (
    <View>
      <SectionHeader title="Стоимость и сроки" />
      <View style={styles.assessmentBox}>
        <Text style={styles.assessmentHighlight}>Расчет стоимости</Text>
        <Text style={styles.assessmentText}>
          Стоимость рассчитывается индивидуально на основе характеристик вашего груза, маршрута и
          условий поставки. Для получения точного расчета свяжитесь с вашим менеджером.
        </Text>
        {ctx.template.deliveryTime ? (
          <Text style={[styles.assessmentText, { marginTop: 8, fontWeight: 'bold', color: DARK }]}>
            Ориентировочные сроки: {ctx.template.deliveryTime}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function MissingFieldsSection({ ctx }: { ctx: ProposalContext }) {
  if (!ctx.missingFields.length) return null;
  return (
    <View>
      <SectionHeader title="Для уточнения расчета необходимо" />
      {ctx.missingFields.map((f, i) => (
        <View key={i} style={styles.missingItem}>
          <Text style={styles.missingBullet}>•</Text>
          <Text style={styles.missingText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

function WhyChinaBridgeSection() {
  return (
    <View>
      <SectionHeader title="Почему ChinaBridge" />
      {WHY_CHINABRIDGE.map((item, i) => (
        <View key={i} style={styles.benefitRow}>
          <Text style={styles.benefitCheck}>✓</Text>
          <Text style={styles.benefitText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ProcessSection() {
  return (
    <View>
      <SectionHeader title="Этапы сотрудничества" />
      {COOPERATION_STEPS.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepNum}>{i + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function EnterpriseSection({ ctx }: { ctx: ProposalContext }) {
  return (
    <View>
      <SectionHeader title="Индивидуальный подход" />
      <View style={styles.assessmentBox}>
        <Text style={styles.assessmentHighlight}>ENTERPRISE — расширенный пакет</Text>
        <Text style={styles.assessmentText}>
          Для {ctx.lead.company || ctx.lead.name || 'вашей компании'} мы разработаем персональный
          план поставок с выделенным менеджером и приоритетным обслуживанием на всех этапах.
        </Text>
        <Text style={[styles.assessmentText, { marginTop: 8 }]}>
          В рамках ENTERPRISE включены: персональный кабинет с аналитикой, ежемесячные отчеты,
          приоритетная обработка грузов и индивидуальные тарифы на объёмы от 5 CBM в месяц.
        </Text>
      </View>
    </View>
  );
}

function PageHeader({ ctx }: { ctx: ProposalContext }) {
  return (
    <View style={styles.headerBar}>
      <Text style={styles.headerLogo}>ChinaBridge</Text>
      <Text style={styles.headerDocNum}>{ctx.number}</Text>
    </View>
  );
}

function ContactsPage({ ctx }: { ctx: ProposalContext }) {
  return (
    <Page size="A4" style={{ fontFamily: 'Roboto', backgroundColor: DARK, paddingBottom: 40 }}>
      <View style={styles.contactsHeader}>
        <Text style={styles.contactsTitle}>Свяжитесь с нами</Text>
        <Text style={styles.contactsSub}>
          Мы готовы ответить на ваши вопросы 7 дней в неделю
        </Text>
      </View>
      <View style={styles.contactsBody}>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Телефон</Text>
          <Text style={styles.contactValue}>{CONTACTS.phone}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Telegram</Text>
          <Text style={styles.contactValue}>{CONTACTS.telegram}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>{CONTACTS.email}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Сайт</Text>
          <Text style={styles.contactValue}>{CONTACTS.website}</Text>
        </View>

        {/* QR Placeholder */}
        <View style={{ marginTop: 30 }}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR{'\n'}Telegram</Text>
          </View>
        </View>

        {/* Document reference */}
        <View style={{ marginTop: 40 }}>
          <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
            Документ: {ctx.number} · Подготовлен для: {ctx.lead.name || 'Клиент'}
          </Text>
          <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            Данный расчет действителен в течение 14 дней с момента подготовки.
          </Text>
        </View>
      </View>

      <Text style={[styles.footerText, { color: 'rgba(255,255,255,0.3)' }]}>
        ChinaBridge — {CONTACTS.website} · {CONTACTS.email}
      </Text>
    </Page>
  );
}

// ─── Main document ───────────────────────────────────────────────

export function ProposalDocument({ ctx }: { ctx: ProposalContext }) {
  if (ctx.mode === 'EXPRESS') {
    return (
      <Document>
        <CoverPage ctx={ctx} />
        <Page size="A4" style={styles.page}>
          <PageHeader ctx={ctx} />
          <View style={styles.body}>
            <ClientSection ctx={ctx} />
            <CargoSection ctx={ctx} />
            <SolutionSection ctx={ctx} brief={true} />
            <BenefitsSection ctx={ctx} />
            <AssessmentSection ctx={ctx} />
            <MissingFieldsSection ctx={ctx} />
          </View>
          {/* Contacts footer on last content page */}
          <View style={{ paddingHorizontal: 40, marginTop: 24, borderTopWidth: 1, borderTopColor: '#fee2e2', paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 8, color: DARK }}>Тел: {CONTACTS.phone}</Text>
              <Text style={{ fontSize: 8, color: DARK }}>TG: {CONTACTS.telegram}</Text>
              <Text style={{ fontSize: 8, color: DARK }}>{CONTACTS.website}</Text>
            </View>
          </View>
          <Text style={styles.footerText}>{ctx.number} · ChinaBridge · {CONTACTS.website}</Text>
        </Page>
      </Document>
    );
  }

  if (ctx.mode === 'BUSINESS') {
    return (
      <Document>
        <CoverPage ctx={ctx} />

        {/* Page 2: Client + Cargo + Solution */}
        <Page size="A4" style={styles.page}>
          <PageHeader ctx={ctx} />
          <View style={styles.body}>
            <ClientSection ctx={ctx} />
            <CargoSection ctx={ctx} />
            <SolutionSection ctx={ctx} brief={false} />
          </View>
          <Text style={styles.footerText}>{ctx.number} · ChinaBridge · {CONTACTS.website}</Text>
        </Page>

        {/* Page 3: Benefits + Assessment + Missing + Why */}
        <Page size="A4" style={styles.page}>
          <PageHeader ctx={ctx} />
          <View style={styles.body}>
            <BenefitsSection ctx={ctx} />
            <AssessmentSection ctx={ctx} />
            <MissingFieldsSection ctx={ctx} />
            <WhyChinaBridgeSection />
          </View>
          <Text style={styles.footerText}>{ctx.number} · ChinaBridge · {CONTACTS.website}</Text>
        </Page>

        <ContactsPage ctx={ctx} />
      </Document>
    );
  }

  // ENTERPRISE
  return (
    <Document>
      <CoverPage ctx={ctx} />

      {/* Page 2: Client + Cargo */}
      <Page size="A4" style={styles.page}>
        <PageHeader ctx={ctx} />
        <View style={styles.body}>
          <ClientSection ctx={ctx} />
          <CargoSection ctx={ctx} />
          <SolutionSection ctx={ctx} brief={false} />
        </View>
        <Text style={styles.footerText}>{ctx.number} · ChinaBridge · {CONTACTS.website}</Text>
      </Page>

      {/* Page 3: Benefits + Process */}
      <Page size="A4" style={styles.page}>
        <PageHeader ctx={ctx} />
        <View style={styles.body}>
          <BenefitsSection ctx={ctx} />
          <ProcessSection />
        </View>
        <Text style={styles.footerText}>{ctx.number} · ChinaBridge · {CONTACTS.website}</Text>
      </Page>

      {/* Page 4: Why + Assessment + Missing + Enterprise */}
      <Page size="A4" style={styles.page}>
        <PageHeader ctx={ctx} />
        <View style={styles.body}>
          <WhyChinaBridgeSection />
          <AssessmentSection ctx={ctx} />
          <MissingFieldsSection ctx={ctx} />
          <EnterpriseSection ctx={ctx} />
        </View>
        <Text style={styles.footerText}>{ctx.number} · ChinaBridge · {CONTACTS.website}</Text>
      </Page>

      <ContactsPage ctx={ctx} />
    </Document>
  );
}
