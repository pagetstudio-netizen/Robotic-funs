import{a as C,r as T,c as u,j as e,M as E}from"./index-Bm5GOQJb.js";import{g as R}from"./countries-xvgefp7T.js";import{E as y}from"./empty-state-O_wIq1-4.js";import{g as w}from"./transaction-order-number-CpffoTUi.js";import{C as S}from"./chevron-left-DYXHsDAY.js";import{L as F}from"./loader-circle-CPBBBmqS.js";const b=r=>{const t=new Date(r);if(Number.isNaN(t.getTime()))return"Date indisponible";const i=d=>String(d).padStart(2,"0");return`${i(t.getDate())}-${i(t.getMonth()+1)}-${t.getFullYear()} ${i(t.getHours())}:${i(t.getMinutes())}:${i(t.getSeconds())}`},_=(r,t)=>{switch(r){case"completed":case"approved":return{label:t==="withdrawal"?"Transfert terminé":t==="deposit"?"Dépôt terminé":"Crédité",tone:"is-success"};case"rejected":case"failed":case"canceled":case"cancelled":return{label:t==="withdrawal"?"Transfert échoué":t==="deposit"?"Dépôt échoué":"Échec",tone:"is-failure"};case"processing":return{label:"En cours",tone:"is-pending"};default:return{label:"En attente",tone:"is-pending"}}},B=r=>{const t=r?.trim(),i=t?.replace(/\D/g,"")??"";if(!i)return"";const d=i.length>3?i.slice(0,1):"",o=i.slice(-2),a=Math.max(1,i.length-d.length-o.length);return`${t?.startsWith("+")?"+":""}${d}${"*".repeat(a)}${o}`},k=new Set(["signup_bonus","gift_code","checkin","check_in","daily_checkin","wheel_prize"]),q=r=>{const t=r.type.toLowerCase(),i=r.description?.toLowerCase()||"";return k.has(t)?!0:t!=="bonus"&&t!=="daily_bonus"?!1:/inscription|quotidien|check.?in|pointage|connexion/.test(i)},I=r=>{const t=r.description?.trim()||"",i=t.toLowerCase();return/inscription/.test(i)||r.type==="signup_bonus"?"Bonus d'inscription":/cadeau/.test(i)||r.type==="gift_code"?"Code cadeau":/roue de la fortune/.test(i)||r.type==="wheel_prize"?"Gain de la roue de la fortune":/quotidien|check.?in|pointage|connexion/.test(i)||k.has(r.type.toLowerCase())?"Récompenses de connexion":t||"Récompense"};function z({code:r,createdAt:t,amount:i,status:d,currency:o,kind:a,fallbackDetail:n,accountNumber:m,referenceLabel:l,fees:p,testId:h}){const x=_(d,a),g=B(m),f=g?`(${g})`:n;return e.jsxs("article",{className:"history-card","data-testid":h,children:[e.jsxs("div",{className:"history-row history-row-meta",children:[e.jsx("span",{children:b(t)}),e.jsx("strong",{className:`history-status ${x.tone}`,children:x.label})]}),e.jsxs("div",{className:"history-row history-row-main",children:[e.jsx("span",{children:f}),e.jsxs("strong",{className:"history-amount",children:[i," ",o]})]}),e.jsxs("div",{className:"history-row history-row-reference",children:[e.jsx("span",{children:l}),e.jsx("strong",{className:"history-value",title:r,children:r})]}),p!=null&&e.jsxs("div",{className:"history-row history-row-fees",children:[e.jsx("span",{children:"Frais"}),e.jsxs("strong",{className:"history-value",children:[p," ",o]})]})]})}function M({title:r,createdAt:t,amount:i,currentBalance:d,balanceLabel:o,currency:a,orderNumber:n,testId:m}){const l=p=>{const h=Number(p||0);return(Number.isFinite(h)?h:0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})};return e.jsxs("article",{className:"reward-row","data-testid":m,"data-order-number":n,"aria-label":`${r}, ${b(t)}, montant ${l(i)} ${a}, numéro de commande ${n}`,title:`Numéro de commande ${n}`,children:[e.jsxs("div",{className:"reward-row-heading",children:[e.jsx("strong",{className:"reward-row-title",children:r}),e.jsx("time",{className:"reward-row-date",children:b(t)})]}),e.jsxs("div",{className:"reward-row-values",children:[e.jsxs("strong",{children:["+ ",l(i)]}),e.jsxs("span",{children:[o||"Solde actuel"," ",l(d)," ",a]})]})]})}function Y(){const{user:r}=C(),[t,i]=T.useState("rewards"),{data:d=[]}=u({queryKey:["/api/countries"]}),o=r?R(r.country,d):null,a=o?.currency==="XOF"||o?.currency==="XAF"?"FCFA":o?.currency||"FCFA",n=s=>{const c=Number(s||0);return(Number.isFinite(c)?Math.round(c):0).toLocaleString("fr-FR")},{data:m=[],isLoading:l,isError:p}=u({queryKey:["/api/deposits/history"],enabled:!!r&&t==="deposits"}),{data:h=[],isLoading:x,isError:g}=u({queryKey:["/api/withdrawals/history"],enabled:!!r&&t==="withdrawals"}),{data:f=[],isLoading:$,isError:A}=u({queryKey:["/api/transactions"],enabled:!!r&&t==="rewards"});if(!r)return null;const j=f.filter(q).sort((s,c)=>new Date(c.createdAt).getTime()-new Date(s.createdAt).getTime()),N=[...m].sort((s,c)=>new Date(c.createdAt).getTime()-new Date(s.createdAt).getTime()),v=[...h].sort((s,c)=>new Date(c.createdAt).getTime()-new Date(s.createdAt).getTime()),D=t==="rewards"?$:t==="deposits"?l:x,L=t==="rewards"?A:t==="deposits"?p:g;return e.jsxs("main",{className:"history-page",children:[e.jsx("style",{children:`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: clip;
          background: #fff;
          color: #171717;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #fff;
        }
        .history-header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          height: 52px;
          align-items: center;
          padding: 0 18px;
          background: #24232f;
          color: #fff;
        }
        .history-back {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 0;
          padding: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
        }
        .history-back svg {
          width: 25px;
          height: 25px;
          stroke-width: 1.9;
        }
        .history-title {
          position: absolute;
          right: 48px;
          left: 48px;
          margin: 0;
          color: #fff;
          font-size: 22px;
          font-weight: 400;
          line-height: 1;
          text-align: center;
        }
        .history-balance-card {
          display: flex;
          height: clamp(180px, 41.2vw, 211px);
          flex-direction: column;
          margin: 32px 4% 38px;
          padding: 30px 20px 25px;
          border-radius: 20px;
          background: #24232f;
          color: #fff;
        }
        .history-balance-label {
          color: #d6d4dc;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.25;
        }
        .history-balance-grid {
          display: grid;
          flex: 1;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: center;
          gap: 12px;
          margin-top: 14px;
        }
        .history-balance-item {
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }
        .history-balance-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin: 0;
          color: #fff;
          font-size: clamp(20px, 5.6vw, 30px);
          font-weight: 700;
          line-height: 1.1;
          overflow-wrap: anywhere;
          text-align: center;
        }
        .history-tabs {
          position: sticky;
          top: 52px;
          z-index: 40;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          align-items: center;
          min-height: 62px;
          margin: 0;
          padding: 9px 4%;
          border-bottom: 1px solid #eeeeef;
          background: #fff;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          padding: 5px 6px;
          background: #f3f3f5;
          color: #5f5f64;
          font-size: clamp(11px, 2.8vw, 14px);
          font-weight: 600;
          line-height: 1.15;
          text-align: center;
          white-space: normal;
          cursor: pointer;
          transition: background-color .16s ease, color .16s ease, transform .12s ease;
        }
        .history-tab.active {
          background: #24232f;
          color: #fff;
          font-weight: 700;
        }
        .history-tab:active { transform: scale(.98); }
        .history-tab:focus-visible,
        .history-back:focus-visible {
          outline: 3px solid #c1c0c9;
          outline-offset: 2px;
        }
        .history-content {
          min-height: calc(100dvh - 390px);
          padding: 0 4% 40px;
        }
        .history-list {
          display: grid;
          gap: 0;
        }
        .reward-row {
          padding: 21px 0 18px;
          border-bottom: 1px solid #ededed;
          color: #111;
        }
        .reward-row-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .reward-row-title {
          max-width: 60%;
          color: #686868;
          font-size: clamp(18px, 4.2vw, 22px);
          font-weight: 700;
          line-height: 1.55;
        }
        .reward-row-date {
          flex: 0 0 auto;
          padding-top: 4px;
          color: #a1a1a1;
          font-size: clamp(12px, 3.1vw, 16px);
          line-height: 1.35;
          white-space: nowrap;
        }
        .reward-row-values {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 13px;
          color: #111;
          font-size: clamp(16px, 3.9vw, 20px);
          line-height: 1.35;
        }
        .reward-row-values strong,
        .reward-row-values span {
          font-weight: 700;
        }
        .history-card {
          width: 100%;
          border: 0;
          border-bottom: 1px solid #ededed;
          border-radius: 0;
          display: flex;
          min-height: 100px;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px 0;
          background: #fff;
          box-shadow: none;
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #777;
          font-size: 14px;
          line-height: 1.35;
        }
        .history-row > span {
          min-width: 0;
          flex: 1;
        }
        .history-row strong {
          min-width: 0;
          max-width: 65%;
          color: #171717;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .history-row-meta { color: #999; font-size: 13px; }
        .history-row-meta strong {
          color: #999;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .history-row-main {
          color: #171717;
          font-size: 15px;
        }
        .history-row-main > span {
          color: #171717;
          font-weight: 500;
          overflow-wrap: anywhere;
        }
        .history-row .history-amount {
          color: #171717;
          font-size: 16px;
          font-weight: 700;
          white-space: nowrap;
        }
        .history-row-reference,
        .history-row-fees {
          color: #777;
          font-size: 13px;
        }
        .history-row .history-value {
          color: #555;
          font-size: 13px;
          font-weight: 700;
        }
        .history-row .history-status {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          white-space: nowrap;
        }
        .history-status.is-success { color: #777; }
        .history-status.is-failure { color: #bc3434; }
        .history-status.is-pending { color: #9a6b0a; }
        .history-empty {
          display: flex;
          min-height: 300px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #768078;
          font-size: 14px;
        }
        .history-load-error {
          padding: 32px 16px;
          color: #9c3434;
          text-align: center;
          font-size: 14px;
        }
        @media (max-width: 370px) {
          .history-title { font-size: 17px; }
          .history-tabs { gap: 5px; padding-right: 3%; padding-left: 3%; }
          .history-tab { font-size: 11px; }
          .history-content { padding-right: 3%; padding-left: 3%; }
          .history-balance-card { margin-right: 3%; margin-left: 3%; padding-right: 14px; padding-left: 14px; }
          .history-balance-grid { gap: 14px; }
          .history-balance-label { font-size: 13px; }
          .history-balance-value { font-size: 18px; }
          .history-card { padding-right: 0; padding-left: 0; }
          .history-row { gap: 8px; font-size: 12px; }
          .history-row strong { font-size: 11px; }
          .history-row-meta,
          .history-row-meta strong { font-size: 10px; }
          .history-row .history-amount { font-size: 13px; }
          .history-row .history-value { font-size: 11px; }
          .reward-row-heading { gap: 6px; }
          .reward-row-title { max-width: 56%; font-size: 16px; }
          .reward-row-date { font-size: 10px; }
          .reward-row-values { font-size: 13px; }
        }
      `}),e.jsxs("div",{className:"history-screen",children:[e.jsxs("header",{className:"history-header",children:[e.jsx(E,{href:"/account",children:e.jsx("button",{className:"history-back","data-testid":"button-back","aria-label":"Retour",children:e.jsx(S,{"aria-hidden":"true"})})}),e.jsx("h1",{className:"history-title",children:"Historique du solde"})]}),e.jsx("section",{className:"history-balance-card","aria-label":"Soldes disponibles",children:e.jsxs("div",{className:"history-balance-grid",children:[e.jsxs("div",{className:"history-balance-item",children:[e.jsx("span",{className:"history-balance-label",children:"Solde de retrait"}),e.jsxs("strong",{className:"history-balance-value",children:[n(r.withdrawalBalance||"0")," ",a]})]}),e.jsxs("div",{className:"history-balance-item",children:[e.jsx("span",{className:"history-balance-label",children:"Solde de dépôt"}),e.jsxs("strong",{className:"history-balance-value",children:[n(r.depositBalance||"0")," ",a]})]})]})}),e.jsxs("nav",{className:"history-tabs","aria-label":"Type d'enregistrement",children:[e.jsx("button",{type:"button",className:`history-tab ${t==="rewards"?"active":""}`,onClick:()=>i("rewards"),"aria-pressed":t==="rewards","data-testid":"tab-rewards",children:"Récompenses"}),e.jsx("button",{type:"button",className:`history-tab ${t==="deposits"?"active":""}`,onClick:()=>i("deposits"),"aria-pressed":t==="deposits","data-testid":"tab-deposit-orders",children:"Ordres de dépôt"}),e.jsx("button",{type:"button",className:`history-tab ${t==="withdrawals"?"active":""}`,onClick:()=>i("withdrawals"),"aria-pressed":t==="withdrawals","data-testid":"tab-withdrawal-orders",children:"Ordres de retrait"})]}),e.jsx("section",{className:"history-content","aria-live":"polite",children:D?e.jsx("div",{className:"history-empty",children:e.jsx(F,{className:"animate-spin"})}):L?e.jsx("p",{className:"history-load-error",children:"Impossible de charger cet historique. Réessayez plus tard."}):t==="rewards"?j.length>0?e.jsx("div",{className:"history-list",children:j.map(s=>e.jsx(M,{testId:`free-earning-item-${s.id}`,orderNumber:w("earning",s.id),createdAt:s.createdAt,title:I(s),amount:s.amount,currentBalance:s.type==="wheel_prize"?r.depositBalance||"0":r.balance||"0",balanceLabel:s.type==="wheel_prize"?"Solde de dépôt":void 0,currency:a},s.id))}):e.jsx(y,{className:"history-empty",children:e.jsx("span",{children:"Plus de données"})}):t==="deposits"?N.length>0?e.jsx("div",{className:"history-list",children:N.map(s=>e.jsx(z,{testId:`deposit-item-${s.id}`,code:w("deposit",s.id),createdAt:s.createdAt,amount:n(s.amount),status:s.status,currency:a,kind:"deposit",fallbackDetail:"Dépôt",accountNumber:s.accountNumber,referenceLabel:"Numéro de commande"},s.id))}):e.jsx(y,{className:"history-empty",children:e.jsx("span",{children:"Plus de données"})}):v.length>0?e.jsx("div",{className:"history-list",children:v.map(s=>e.jsx(z,{testId:`withdrawal-item-${s.id}`,code:w("withdrawal",s.id),createdAt:s.createdAt,amount:n(s.netAmount??s.amount),status:s.status,currency:a,kind:"withdrawal",fallbackDetail:"Retrait",accountNumber:s.accountNumber,referenceLabel:"Numéro de commande",fees:s.fees==null?void 0:n(s.fees)},s.id))}):e.jsx(y,{className:"history-empty",children:e.jsx("span",{children:"Plus de données"})})})]})]})}export{Y as default};
