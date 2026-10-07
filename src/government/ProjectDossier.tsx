import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import { getInvestorControlSnapshot } from './investorControlModel.ts';
import { investorMvpOffer } from './investorMvpOffer.ts';
import { currentPilotReadinessDossier } from './pilotReadinessDossier.ts';
import { visitorPilotExecution, yclientsProviderActivation } from './pilotExecutionPack.ts';

type LayerId = 'decision' | 'commercial' | 'proof' | 'confidentiality';

const labels: Record<AppLanguage, {
  kicker:string; title:string; subtitle:string; decision:string; commercial:string; proof:string; confidentiality:string;
  details:string; hide:string; contract:string; exportLabel:string; blockers:string; ready:string; open:string; note:string;
}> = {
  ru: {
    kicker:'PROJECT DOSSIER · EXECUTIVE VIEW',
    title:'Варварка — Зарядье · решение за 30–60 секунд',
    subtitle:'Первый экран показывает только то, что нужно ЛПР: что решаем, за что платим, что доказано и где проходят границы данных.',
    decision:'1 · DECISION', commercial:'2 · COMMERCIAL', proof:'3 · PROOF', confidentiality:'4 · CONFIDENTIALITY',
    details:'Детали', hide:'Скрыть', contract:'Открыть Contract Builder', exportLabel:'Печать / сохранить PDF',
    blockers:'блокеров', ready:'готово', open:'не закрыто',
    note:'Dossier не является утверждённой закупкой, ценой или заявлением о готовности к масштабированию. Proof и внешние approvals остаются fail-closed.'
  },
  en: {
    kicker:'PROJECT DOSSIER · EXECUTIVE VIEW',
    title:'Varvarka — Zaryadye · 30–60 second decision view',
    subtitle:'The first screen shows only what an executive needs: the decision, commercial model, proof state and data boundary.',
    decision:'1 · DECISION', commercial:'2 · COMMERCIAL', proof:'3 · PROOF', confidentiality:'4 · CONFIDENTIALITY',
    details:'Details', hide:'Hide', contract:'Open Contract Builder', exportLabel:'Print / save PDF',
    blockers:'blockers', ready:'ready', open:'open',
    note:'This dossier is not an approved procurement, price or scale-readiness claim. Proof and external approvals remain fail-closed.'
  },
  zh: {
    kicker:'PROJECT DOSSIER · EXECUTIVE VIEW',
    title:'瓦尔瓦尔卡 — 扎里亚季耶 · 30–60 秒决策视图',
    subtitle:'首屏只保留决策者需要的信息：当前决策、商业模型、证据状态与数据边界。',
    decision:'1 · 决策', commercial:'2 · 商业', proof:'3 · 证据', confidentiality:'4 · 数据边界',
    details:'详情', hide:'收起', contract:'打开 Contract Builder', exportLabel:'打印 / 保存 PDF',
    blockers:'阻塞项', ready:'就绪', open:'未关闭',
    note:'本 Dossier 不代表已批准采购、价格或规模化就绪。证据与外部审批仍采用 fail-closed。'
  }
};

function localized(language: AppLanguage) {
  if (language === 'ru') {
    return {
      decisionHeadline:'Согласовать bounded pilot, а не масштабирование.',
      decisionBody:'Нужны профильный owner Москвы, площадка, integration/data owner и рабочая сессия по scope + acceptance + правовой форме.',
      decisionDetail:'Следующий шаг открывает реальный evidence path. City-wide rollout, ROI и capital commitment до proof не запрашиваются.',
      commercialHeadline:'4 слоя оплаты · цена пока не заявлена.',
      commercialBody:'Pilot → platform/run → district pack → integrations/change requests. Масштабная экономика считается только после measured production inputs.',
      commercialDetail:investorMvpOffer.paymentLayers.map((x) => x.title).join(' · '),
      proofHeadline:'Текущий статус определяется authority, а не презентацией.',
      proofBody:'Field proof, provider proof, visitor pilot, governance и measured economics должны закрыться реальными evidence refs.',
      confidentialityHeadline:'Минимизация данных + секреты вне репозитория.',
      confidentialityBody:'Aggregate-only visitor analytics; consent/recruitment отдельно; provider credentials только runtime secrets; security/data-flow review обязателен.',
      confidentialityDetail:'Запрещены names, phone, email, booking IDs, device IDs и GPS в pilot analytics. YCLIENTS secrets never commit.'
    };
  }
  if (language === 'en') {
    return {
      decisionHeadline:'Approve a bounded pilot, not scale.',
      decisionBody:'Name the Moscow problem owner, pilot site, integration/data owner and a working session for scope + acceptance + legal form.',
      decisionDetail:'The next step opens the real evidence path. City-wide rollout, ROI and capital commitment are explicitly out of scope before proof.',
      commercialHeadline:'4 payment layers · no price claimed yet.',
      commercialBody:'Pilot → platform/run → district pack → integrations/change requests. Scale economics are calculated only after measured production inputs.',
      commercialDetail:investorMvpOffer.paymentLayers.map((x) => x.title).join(' · '),
      proofHeadline:'Authority state, not presentation, controls readiness.',
      proofBody:'Field proof, provider proof, visitor pilot, governance and measured economics must close with real evidence references.',
      confidentialityHeadline:'Data minimisation + secrets outside the repository.',
      confidentialityBody:'Aggregate-only visitor analytics; consent/recruitment stays separate; provider credentials are runtime secrets; security/data-flow review is mandatory.',
      confidentialityDetail:'No names, phone, email, booking IDs, device IDs or GPS in pilot analytics. YCLIENTS secrets never commit.'
    };
  }
  return {
    decisionHeadline:'批准有限试点，而不是规模化。',
    decisionBody:'需要确认莫斯科业务 owner、试点场地、integration/data owner，并召开 scope + acceptance + 法律形式工作会。',
    decisionDetail:'下一步是打开真实 evidence path。完成 proof 前不请求 city-wide rollout、ROI 或 capital commitment。',
    commercialHeadline:'4 层付费模型 · 当前不声明价格。',
    commercialBody:'Pilot → platform/run → district pack → integrations/change requests。只有在真实 production inputs 被测量后才计算规模经济。',
    commercialDetail:investorMvpOffer.paymentLayers.map((x) => x.title).join(' · '),
    proofHeadline:'Readiness 由 authority state 控制，而不是演示文稿。',
    proofBody:'Field proof、provider proof、visitor pilot、governance 与 measured economics 都必须由真实 evidence refs 关闭。',
    confidentialityHeadline:'数据最小化 + secrets 不进入仓库。',
    confidentialityBody:'游客分析仅 aggregate；consent/recruitment 分离；provider credentials 仅为 runtime secrets；必须完成 security/data-flow review。',
    confidentialityDetail:'Pilot analytics 不包含姓名、电话、邮箱、booking IDs、device IDs 或 GPS。YCLIENTS secrets never commit.'
  };
}

export default function ProjectDossier({
  language,
  onOpenContract
}: {
  language: AppLanguage;
  onOpenContract: () => void;
}) {
  const snapshot = useMemo(() => getInvestorControlSnapshot(), []);
  const t = labels[language];
  const c = localized(language);
  const [openLayer, setOpenLayer] = useState<LayerId | null>(null);
  const readiness = currentPilotReadinessDossier.summary;

  const proofStatus = snapshot.scaleDecision.decisionPackReady ? t.ready : t.open;
  const proofTone = snapshot.scaleDecision.decisionPackReady ? styles.statusReady : styles.statusOpen;

  return (
    <View style={styles.root} testID="project-dossier">
      <View style={styles.topline}>
        <View style={styles.heading}>
          <Text style={styles.kicker}>{t.kicker}</Text>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
        <View style={[styles.statusPill, proofTone]}>
          <Text style={styles.statusText}>
            {readiness.total} {t.blockers} · {proofStatus}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Layer
          id="decision"
          label={t.decision}
          headline={c.decisionHeadline}
          body={c.decisionBody}
          detail={c.decisionDetail}
          open={openLayer === 'decision'}
          onToggle={() => setOpenLayer(openLayer === 'decision' ? null : 'decision')}
          show={t.details}
          hide={t.hide}
        />
        <Layer
          id="commercial"
          label={t.commercial}
          headline={c.commercialHeadline}
          body={c.commercialBody}
          detail={c.commercialDetail}
          open={openLayer === 'commercial'}
          onToggle={() => setOpenLayer(openLayer === 'commercial' ? null : 'commercial')}
          show={t.details}
          hide={t.hide}
        />
        <Layer
          id="proof"
          label={t.proof}
          headline={c.proofHeadline}
          body={c.proofBody}
          detail={
            `Field ${readiness.blockedField} · External ${readiness.blockedExternal} · Legal ${readiness.blockedLegal} · Preparatory ${readiness.preparableNow} · Phase 0 ${readiness.phase0Status}`
          }
          open={openLayer === 'proof'}
          onToggle={() => setOpenLayer(openLayer === 'proof' ? null : 'proof')}
          show={t.details}
          hide={t.hide}
          warning={!snapshot.scaleDecision.decisionPackReady}
        />
        <Layer
          id="confidentiality"
          label={t.confidentiality}
          headline={c.confidentialityHeadline}
          body={c.confidentialityBody}
          detail={c.confidentialityDetail}
          open={openLayer === 'confidentiality'}
          onToggle={() => setOpenLayer(openLayer === 'confidentiality' ? null : 'confidentiality')}
          show={t.details}
          hide={t.hide}
        />
      </View>

      <View style={styles.factBar}>
        <Fact value={String(visitorPilotExecution.minimumParticipants) + '–' + String(visitorPilotExecution.maximumParticipants)} label="visitor sessions" />
        <Fact value={String(snapshot.scaleDecision.blockerCount)} label={t.blockers} />
        <Fact value={String(yclientsProviderActivation.requiredRuntimeSecrets.length)} label="provider secrets" />
        <Fact value={snapshot.scaleDecision.decisionPackReady ? 'READY' : 'BLOCKED'} label="decision pack" />
      </View>

      <View style={styles.actionRow}>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={t.contract}
          style={styles.cta}
          contentStyle={styles.center}
          onPress={onOpenContract}
        >
          <Text style={styles.ctaText}>{t.contract} →</Text>
        </PhysicalPressable>
        {Platform.OS === 'web' && (
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={t.exportLabel}
            style={styles.secondary}
            contentStyle={styles.center}
            onPress={() => {
              if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
            }}
          >
            <Text style={styles.secondaryText}>{t.exportLabel}</Text>
          </PhysicalPressable>
        )}
      </View>

      <Text style={styles.note}>{t.note}</Text>
    </View>
  );
}

function Layer({
  id, label, headline, body, detail, open, onToggle, show, hide, warning = false
}: {
  id:LayerId; label:string; headline:string; body:string; detail:string; open:boolean;
  onToggle:()=>void; show:string; hide:string; warning?:boolean;
}) {
  return (
    <View style={[styles.layer, warning && styles.layerWarning]} testID={`dossier-${id}`}>
      <Text style={styles.layerLabel}>{label}</Text>
      <Text style={styles.layerHeadline}>{headline}</Text>
      <Text style={styles.layerBody}>{body}</Text>
      {open && <Text style={styles.layerDetail}>{detail}</Text>}
      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={`${open ? hide : show}: ${label}`}
        style={styles.detailButton}
        contentStyle={styles.detailContent}
        onPress={onToggle}
      >
        <Text style={styles.detailText}>{open ? '− ' + hide : '+ ' + show}</Text>
      </PhysicalPressable>
    </View>
  );
}

function Fact({ value, label }: { value:string; label:string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ borderRadius:22, padding:16, backgroundColor:'#121518', borderWidth:1, borderColor:'#6b5732' },
  topline:{ flexDirection:'row', flexWrap:'wrap', gap:12, alignItems:'flex-start', justifyContent:'space-between' },
  heading:{ flex:1, minWidth:260 },
  kicker:{ color:'#c8a96a', fontSize:9, fontWeight:'900', letterSpacing:1.35 },
  title:{ color:'#f4eee4', fontSize:22, lineHeight:27, fontWeight:'900', marginTop:6 },
  subtitle:{ color:'#9da4aa', fontSize:10, lineHeight:15, marginTop:5, maxWidth:760 },
  statusPill:{ borderRadius:999, paddingHorizontal:11, paddingVertical:7, borderWidth:1 },
  statusReady:{ backgroundColor:'#122119', borderColor:'#315f43' },
  statusOpen:{ backgroundColor:'#24191a', borderColor:'#674044' },
  statusText:{ color:'#eadfc9', fontSize:8, fontWeight:'900', textTransform:'uppercase' },
  grid:{ flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:13 },
  layer:{ flexGrow:1, flexBasis:360, minWidth:260, borderRadius:15, padding:12, backgroundColor:'#0e1114', borderWidth:1, borderColor:'#2c3237' },
  layerWarning:{ borderColor:'#604145', backgroundColor:'#151113' },
  layerLabel:{ color:'#c8a96a', fontSize:8, fontWeight:'900', letterSpacing:1.1 },
  layerHeadline:{ color:'#f1ece3', fontSize:14, lineHeight:18, fontWeight:'900', marginTop:6 },
  layerBody:{ color:'#b9c0c5', fontSize:10, lineHeight:15, marginTop:5 },
  layerDetail:{ color:'#858d93', fontSize:9, lineHeight:14, marginTop:8, paddingTop:8, borderTopWidth:1, borderTopColor:'#272c31' },
  detailButton:{ alignSelf:'flex-start', minHeight:30, marginTop:8, borderRadius:9, backgroundColor:'#171b1e', borderWidth:1, borderColor:'#30363b' },
  detailContent:{ alignItems:'center', justifyContent:'center', paddingHorizontal:9 },
  detailText:{ color:'#c7cdd1', fontSize:8, fontWeight:'900' },
  factBar:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:10 },
  fact:{ flexGrow:1, flexBasis:115, minWidth:100, borderRadius:12, paddingVertical:8, paddingHorizontal:10, backgroundColor:'#171411', borderWidth:1, borderColor:'#3d3426' },
  factValue:{ color:'#e8d7b2', fontSize:13, fontWeight:'900' },
  factLabel:{ color:'#81796b', fontSize:7, fontWeight:'800', textTransform:'uppercase', marginTop:2 },
  actionRow:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:11 },
  cta:{ flexGrow:1, minWidth:220, minHeight:42, borderRadius:13, backgroundColor:'#d3b36f' },
  secondary:{ minWidth:180, minHeight:42, borderRadius:13, backgroundColor:'#15181b', borderWidth:1, borderColor:'#3a4046' },
  center:{ alignItems:'center', justifyContent:'center', paddingHorizontal:13 },
  ctaText:{ color:'#17130c', fontSize:10, fontWeight:'900' },
  secondaryText:{ color:'#c7cdd1', fontSize:9, fontWeight:'900' },
  note:{ color:'#747c82', fontSize:7, lineHeight:11, marginTop:8 }
});
