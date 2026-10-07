import{a as $,r as E,c as m,j as e,g as L,L as T}from"./index-xNri_DNC.js";import{g as C}from"./countries-DOninoG6.js";import{E as y}from"./empty-state-RQiKlU94.js";import{g as b}from"./transaction-order-number-CpffoTUi.js";import{C as F}from"./chevron-left-BXmc5c47.js";const S=i=>{const s=new Date(i);if(Number.isNaN(s.getTime()))return"Date indisponible";const r=o=>String(o).padStart(2,"0");return`${s.getFullYear()}-${r(s.getMonth()+1)}-${r(s.getDate())} ${r(s.getHours())}:${r(s.getMinutes())}:${r(s.getSeconds())}`},I=(i,s)=>{switch(i){case"completed":case"approved":return{label:s==="withdrawal"?"Transfert terminé":s==="deposit"?"Dépôt terminé":"Crédité",tone:"is-success"};case"rejected":case"failed":case"canceled":case"cancelled":return{label:s==="withdrawal"?"Transfert échoué":s==="deposit"?"Dépôt échoué":"Échec",tone:"is-failure"};case"processing":return{label:"En cours",tone:"is-pending"};default:return{label:"En attente",tone:"is-pending"}}},R=i=>{const s=i?.trim(),r=s?.replace(/\D/g,"")??"";if(!r)return"";const o=r.length>3?r.slice(0,1):"",a=r.slice(-2),c=Math.max(1,r.length-o.length-a.length);return`${s?.startsWith("+")?"+":""}${o}${"*".repeat(c)}${a}`},_=new Set(["free_claim","earning","task_reward","signup_bonus","bonus","commission","deposit_commission","gift_code","staking_release"]);function w({code:i,createdAt:s,amount:r,status:o,currency:a,kind:c,fallbackDetail:d,accountNumber:u,referenceLabel:g,fees:l,testId:x}){const h=I(o,c),p=R(u),f=p?`(${p})`:d;return e.jsxs("article",{className:"history-card","data-testid":x,children:[e.jsxs("div",{className:"history-row history-row-meta",children:[e.jsx("span",{children:S(s)}),e.jsx("strong",{className:`history-status ${h.tone}`,children:h.label})]}),e.jsxs("div",{className:"history-row history-row-main",children:[e.jsx("span",{children:f}),e.jsxs("strong",{className:"history-amount",children:[r," ",a]})]}),e.jsxs("div",{className:"history-row history-row-reference",children:[e.jsx("span",{children:g}),e.jsx("strong",{className:"history-value",title:i,children:i})]}),l!=null&&e.jsxs("div",{className:"history-row history-row-fees",children:[e.jsx("span",{children:"Frais"}),e.jsxs("strong",{className:"history-value",children:[l," ",a]})]})]})}function M(){const{user:i}=$(),[s,r]=E.useState("free"),{data:o=[]}=m({queryKey:["/api/countries"]}),a=i?C(i.country,o):null,c=a?.currency==="XOF"||a?.currency==="XAF"?"FCFA":a?.currency||"FCFA",d=t=>{const n=Number(t||0);return(Number.isFinite(n)?Math.round(n):0).toLocaleString("fr-FR")},{data:u=[],isLoading:g,isError:l}=m({queryKey:["/api/deposits/history"],enabled:!!i&&s==="deposits"}),{data:x=[],isLoading:h,isError:p}=m({queryKey:["/api/withdrawals/history"],enabled:!!i&&s==="withdrawals"}),{data:f=[],isLoading:k,isError:A}=m({queryKey:["/api/transactions"],enabled:!!i&&s==="free"});if(!i)return null;const j=f.filter(t=>_.has(t.type)).sort((t,n)=>new Date(n.createdAt).getTime()-new Date(t.createdAt).getTime()),N=[...u].sort((t,n)=>new Date(n.createdAt).getTime()-new Date(t.createdAt).getTime()),v=[...x].sort((t,n)=>new Date(n.createdAt).getTime()-new Date(t.createdAt).getTime()),z=s==="free"?k:s==="deposits"?g:h,D=s==="free"?A:s==="deposits"?l:p;return e.jsxs("main",{className:"history-page",children:[e.jsx("style",{children:`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          background: #f4f7f3;
          color: #1b241c;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 500px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #f4f7f3;
        }
        .history-header {
          position: relative;
          display: flex;
          height: 68px;
          align-items: center;
          padding: 8px 18px 0;
          background: #fff;
        }
        .history-back {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 0;
          padding: 0;
          background: transparent;
          color: #263329;
          cursor: pointer;
        }
        .history-back svg {
          width: 25px;
          height: 25px;
          stroke-width: 1.9;
        }
        .history-title {
          position: absolute;
          right: 55px;
          left: 55px;
          margin: 0;
          color: #1d2a20;
          font-size: 19px;
          font-weight: 700;
          line-height: 1;
          text-align: center;
        }
        .history-tabs {
          display: grid;
          grid-template-columns: 1.25fr 1fr 1fr;
          gap: 7px;
          align-items: center;
          min-height: 58px;
          margin: 10px 14px 0;
          padding: 5px;
          border: 1px solid #e4eae2;
          border-radius: 13px;
          background: #fff;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9px;
          padding: 0 6px;
          background: transparent;
          color: #556156;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition: background-color .16s ease, color .16s ease;
        }
        .history-tab.active {
          background: #367c2b;
          color: #fff;
          font-weight: 700;
        }
        .history-tab:focus-visible,
        .history-back:focus-visible {
          outline: 3px solid #a8d5a0;
          outline-offset: 2px;
        }
        .history-content {
          min-height: calc(100dvh - 136px);
          padding: 14px 14px 40px;
        }
        .history-list {
          display: grid;
          gap: 12px;
        }
        .history-card {
          width: 100%;
          overflow: hidden;
          border: 1px solid #e5ebe3;
          border-radius: 12px;
          display: flex;
          min-height: 198px;
          flex-direction: column;
          justify-content: space-between;
          padding: 15px 16px;
          background: #fff;
          box-shadow: 0 2px 9px rgba(34, 56, 36, .055);
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #747a74;
          font-size: 13px;
          line-height: 1.35;
        }
        .history-row > span {
          min-width: 0;
          flex: 1;
        }
        .history-row strong {
          min-width: 0;
          max-width: 65%;
          color: #202a21;
          font-size: 13px;
          font-weight: 600;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .history-row-meta {
          color: #858585;
          font-size: 12px;
        }
        .history-row-meta strong {
          color: #858585;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .history-row-main {
          color: #252a25;
          font-size: 14px;
        }
        .history-row-main > span {
          color: #252a25;
          font-weight: 500;
          overflow-wrap: anywhere;
        }
        .history-row .history-amount {
          color: #5c9a71;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
        }
        .history-row-reference,
        .history-row-fees {
          color: #777d77;
          font-size: 13px;
        }
        .history-row .history-value {
          color: #5c9a71;
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
        .history-empty img {
          width: 112px;
          height: 112px;
          object-fit: contain;
        }
        .history-load-error {
          padding: 32px 16px;
          color: #9c3434;
          text-align: center;
          font-size: 14px;
        }
        @media (max-width: 370px) {
          .history-title { font-size: 17px; }
          .history-tabs { margin-right: 10px; margin-left: 10px; gap: 4px; }
          .history-tab { font-size: 12px; }
          .history-content { padding-right: 10px; padding-left: 10px; }
          .history-card { min-height: 190px; padding-right: 11px; padding-left: 11px; }
          .history-row { gap: 8px; font-size: 12px; }
          .history-row strong { font-size: 11px; }
          .history-row-meta,
          .history-row-meta strong { font-size: 10px; }
          .history-row .history-amount { font-size: 13px; }
          .history-row .history-value { font-size: 11px; }
        }
      `}),e.jsxs("div",{className:"history-screen",children:[e.jsxs("header",{className:"history-header",children:[e.jsx(L,{href:"/account",children:e.jsx("button",{className:"history-back","data-testid":"button-back","aria-label":"Retour",children:e.jsx(F,{"aria-hidden":"true"})})}),e.jsx("h1",{className:"history-title",children:"Historique"})]}),e.jsxs("nav",{className:"history-tabs","aria-label":"Type d'enregistrement",children:[e.jsx("button",{type:"button",className:`history-tab ${s==="free"?"active":""}`,onClick:()=>r("free"),"aria-pressed":s==="free","data-testid":"tab-free-earnings",children:"Free Earnings"}),e.jsx("button",{type:"button",className:`history-tab ${s==="deposits"?"active":""}`,onClick:()=>r("deposits"),"aria-pressed":s==="deposits","data-testid":"tab-deposits",children:"Dépôt"}),e.jsx("button",{type:"button",className:`history-tab ${s==="withdrawals"?"active":""}`,onClick:()=>r("withdrawals"),"aria-pressed":s==="withdrawals","data-testid":"tab-withdrawals",children:"Retrait"})]}),e.jsx("section",{className:"history-content","aria-live":"polite",children:z?e.jsx("div",{className:"history-empty",children:e.jsx(T,{className:"animate-spin"})}):D?e.jsx("p",{className:"history-load-error",children:"Impossible de charger cet historique. Réessayez plus tard."}):s==="free"?j.length>0?e.jsx("div",{className:"history-list",children:j.map(t=>e.jsx(w,{testId:`free-earning-item-${t.id}`,code:b("earning",t.id),createdAt:t.createdAt,amount:`+${d(t.amount)}`,status:"approved",currency:c,kind:"earning",fallbackDetail:"Gains",referenceLabel:"Numéro de commande"},t.id))}):e.jsx(y,{className:"history-empty",children:e.jsx("span",{children:"Plus de données"})}):s==="deposits"?N.length>0?e.jsx("div",{className:"history-list",children:N.map(t=>e.jsx(w,{testId:`deposit-item-${t.id}`,code:b("deposit",t.id),createdAt:t.createdAt,amount:d(t.amount),status:t.status,currency:c,kind:"deposit",fallbackDetail:"Dépôt",accountNumber:t.accountNumber,referenceLabel:"Numéro de commande"},t.id))}):e.jsx(y,{className:"history-empty",children:e.jsx("span",{children:"Plus de données"})}):v.length>0?e.jsx("div",{className:"history-list",children:v.map(t=>e.jsx(w,{testId:`withdrawal-item-${t.id}`,code:b("withdrawal",t.id),createdAt:t.createdAt,amount:d(t.netAmount??t.amount),status:t.status,currency:c,kind:"withdrawal",fallbackDetail:"Retrait",accountNumber:t.accountNumber,referenceLabel:"Numéro de commande",fees:t.fees==null?void 0:d(t.fees)},t.id))}):e.jsx(y,{className:"history-empty",children:e.jsx("span",{children:"Plus de données"})})})]})]})}export{M as default};
