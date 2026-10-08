import{f as xe,a as kt,b as St,M as Pt,u as zt,r as s,c as U,j as e,N as z,L as b,e as y}from"./index-CSd6ufQG.js";import{u as w}from"./useMutation-nzh5I-zK.js";import{n as _e}from"./phone-CNsygV_d.js";import{E as ue}from"./empty-state-BufEuwkz.js";import{C as h}from"./chevron-left-BjlsTHBd.js";import{P as K,E,I as Et}from"./phone-LvAdVIvE.js";import{Z as Mt}from"./zap-C6pmrdXe.js";import{R as Q}from"./refresh-cw-DliJYy3v.js";const H=xe("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);const It=xe("Megaphone",[["path",{d:"m3 11 18-5v12L3 14v-3z",key:"n962bs"}],["path",{d:"M11.6 16.8a3 3 0 1 1-5.8-1.6",key:"1yl0tm"}]]);const Ot=xe("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]),Lt="/assets/Screenshot_20261007-115708_1791408054402-BHb2m7vs.png",Be="#367C2B",At="#25591C",x=`linear-gradient(112deg, ${Be} 0%, ${At} 100%)`;function Yt(){const{user:d,refreshUser:J}=kt(),{toast:i}=St(),M=Pt(),[,he]=zt(),ge=s.useRef(null),[c,a]=s.useState("amount"),[l,Ge]=s.useState(null),[Tt,Ut]=s.useState(null),[o,j]=s.useState(""),[N,fe]=s.useState(""),[Z,be]=s.useState(d?.phone||""),[C,ye]=s.useState(""),[Ke,je]=s.useState(""),[ve,we]=s.useState(""),[Ne,Ce]=s.useState(""),[k,Qe]=s.useState(d?.country||""),[X,He]=s.useState(""),[g,I]=s.useState(null),[R,q]=s.useState(null),[Y,F]=s.useState(""),[Je,ee]=s.useState(""),[te,re]=s.useState(""),[ke,Ze]=s.useState(""),[Rt,Xe]=s.useState(""),[Ye,et]=s.useState(""),[Se,O]=s.useState(""),[Pe,f]=s.useState(!1),[tt,rt]=s.useState(d?.country||""),[$,st]=s.useState(""),[L,ze]=s.useState(""),[A,D]=s.useState(null),[se,Ee]=s.useState(""),[ae,Me]=s.useState(""),[qt,Ie]=s.useState(""),[at,nt]=s.useState(""),[Ft,V]=s.useState(""),[Oe,T]=s.useState(!1),u=N,{data:Le=[]}=U({queryKey:["/api/countries"]}),p=Le.find(t=>t.code===u&&t.isActive)?.currency||"FCFA",{data:m}=U({queryKey:["/api/settings"]}),ne=parseInt(m?.minDeposit||"4000");m?.sendavapayEnabled,m?.sendavapayChannelName;const it=m?.westpayEnabled==="true",W=m?.westpayChannelName||"WestPay",Ae=m?.westpayCountries||"",ot=it&&(!Ae||Ae.split(",").map(t=>t.trim()).includes(u)),ie=u.toUpperCase()==="BJ"&&m?.ppayprosPayinEnabled==="true",ct=m?.inpayEnabled==="true",lt=m?.inpayChannelName||"InPay",dt=m?.inpayCountries||"",Te=ct&&dt.split(",").map(t=>t.trim().toUpperCase()).includes(u.toUpperCase()),pt=m?.ashtechEnabled==="true",Ue=m?.ashtechChannelName||"AshtechPay",_=m?.ashtechCountries||"",mt=!_||_.split(",").map(t=>t.trim().toUpperCase()).includes(u.toUpperCase()),ut=pt&&mt,B=Le.filter(t=>t.isActive),Re=_?_.split(",").map(t=>t.trim().toUpperCase()).filter(Boolean):null,{data:Dt=[],isLoading:Vt}=U({queryKey:["/api/payment-numbers",u],queryFn:async()=>{const t=await fetch(`/api/payment-numbers?country=${u}`,{credentials:"include"});if(!t.ok)throw new Error("Erreur");return t.json()},enabled:!!u}),{data:xt,isLoading:ht}=U({queryKey:["/api/sendavapay/operators",k],queryFn:async()=>{const t=await fetch(`/api/sendavapay/operators/${k}`,{credentials:"include"});if(!t.ok)throw new Error("Erreur");return t.json()},enabled:c==="sv-operator"&&!!k}),qe=(xt?.data||[]).filter(t=>t.status==="online"),{data:gt=[],isLoading:ft,isError:Fe,refetch:bt}=U({queryKey:["/api/ashtechpay/countries"],queryFn:async()=>{const t=await fetch("/api/ashtechpay/countries",{credentials:"include"});if(!t.ok)throw new Error("Impossible de charger les opérateurs");return t.json()},enabled:c==="ashtech-operator"&&ut}),G=gt.filter(t=>B.some(r=>r.code.toUpperCase()===t.code.toUpperCase())&&(!Re||Re.includes(t.code.toUpperCase()))),$e=G.find(t=>t.code.trim().toUpperCase()===tt.trim().toUpperCase())||G[0],De=$e?.code||"",Ve=$e?.operators||[];s.useEffect(()=>{if(c!=="sv-waiting"||!R||!Pe)return;const t=setInterval(async()=>{try{const n=await(await fetch(`/api/deposits/${R}/sendavapay-status`,{credentials:"include"})).json();O(n.status),n.status==="approved"?(clearInterval(t),f(!1),i({title:"Paiement confirmé !",description:"Votre solde a été crédité."}),J(),M.invalidateQueries({queryKey:["/api/deposits/history"]}),a("amount"),j(""),I(null),q(null),F(""),ee(""),re(""),O("")):n.status==="rejected"&&(clearInterval(t),f(!1),i({title:"Paiement échoué",description:"Le paiement a été refusé ou annulé.",variant:"destructive"}),a("sv-operator"))}catch{}},5e3);return()=>clearInterval(t)},[c,R,Pe]),s.useEffect(()=>{if(c!=="ashtech-waiting"||!A||!Oe)return;const t=setInterval(async()=>{try{const n=await(await fetch(`/api/deposits/${A}/ashtechpay-status`,{credentials:"include"})).json();V(n.status),n.status==="approved"?(clearInterval(t),T(!1),i({title:"Paiement confirmé !",description:"Votre solde a été crédité."}),J(),M.invalidateQueries({queryKey:["/api/deposits/history"]}),a("amount"),j(""),D(null),V("")):n.status==="rejected"&&(clearInterval(t),T(!1),i({title:"Paiement échoué",description:"Le paiement a été refusé ou annulé.",variant:"destructive"}),a("ashtech-operator"))}catch{}},5e3);return()=>clearInterval(t)},[c,A,Oe]);const yt=t=>{const r=t.target.files?.[0];if(!r)return;if(r.size>5*1024*1024){i({title:"Fichier trop grand",description:"Maximum 5 Mo",variant:"destructive"});return}je(r.name);const n=new FileReader;n.onload=v=>ye(v.target?.result),n.readAsDataURL(r)},oe=w({mutationFn:async()=>{if(!l)throw new Error("Aucun numéro sélectionné");const t=await y("POST","/api/deposits",{amount:Number(o),accountName:d?.fullName||"",accountNumber:Z,paymentMethod:l.operatorName,country:u,paymentNumberId:l.id,channelName:l.paymentLink?`${l.operatorName} - Lien de paiement`:`${l.operatorName} - ${l.phone}`,screenshot:C||null,paymentMessage:ve||null,reference:Ne||null});if(!t.ok){const r=await t.json();throw new Error(r.message||"Erreur")}return t.json()},onSuccess:()=>{i({title:"Demande envoyée !",description:"Votre dépôt est en attente de validation"}),M.invalidateQueries({queryKey:["/api/deposits/history"]}),J(),a("amount"),Ge(null),j(""),be(d?.phone||""),ye(""),je(""),we(""),Ce("")},onError:t=>i({title:"Erreur",description:t.message,variant:"destructive"})}),[Wt,jt]=s.useState(null),[_t,vt]=s.useState("");s.useEffect(()=>{const t=new URLSearchParams(window.location.search),r=t.get("wp_status"),n=t.get("wp_depositId");r&&(vt(r),n&&jt(parseInt(n)),window.history.replaceState({},"","/deposit"),r==="success"&&(i({title:"Paiement en cours de confirmation",description:"Votre dépôt sera crédité dès confirmation WestPay."}),M.invalidateQueries({queryKey:["/api/deposits/history"]})))},[]),s.useEffect(()=>{new URLSearchParams(window.location.search).get("ppaypros_status")==="returned"&&(window.history.replaceState({},"","/deposit"),i({title:"Retour du paiement reçu",description:"Le solde sera crédité uniquement après confirmation du paiement."}),M.invalidateQueries({queryKey:["/api/deposits/history"]}))},[]);const S=w({mutationFn:async()=>{const t=await y("POST","/api/deposits",{amount:Number(o),accountName:d?.fullName||"",accountNumber:d?.phone||"",paymentMethod:"WestPay",country:u,useWestpay:!0});if(!t.ok){const r=await t.json();throw new Error(r.message||"Erreur WestPay")}return t.json()},onSuccess:t=>{t.westpayUrl&&(window.location.href=t.westpayUrl)},onError:t=>i({title:"Erreur WestPay",description:t.message,variant:"destructive"})}),ce=w({mutationFn:async()=>{if(d?.country?.toUpperCase()!=="BJ")throw new Error("Ce paiement nécessite un compte enregistré au Bénin.");const t=_e(d?.phone);if(!t)throw new Error("Le numéro béninois enregistré sur votre compte est invalide. Les 8 chiffres locaux sont complétés avec 01.");const r=await y("POST","/api/deposits",{amount:Number(o),accountName:d?.fullName||"",accountNumber:t,paymentMethod:"PPayPros",country:u,usePpaypros:!0});if(!r.ok){const n=await r.json(),v=String(n.message||"");throw new Error(/ppaypros/i.test(v)?"Impossible de préparer le paiement. Réessayez ou contactez le service client.":v||"Impossible de préparer le paiement.")}return r.json()},onSuccess:t=>{t.ppayprosUrl?window.location.assign(t.ppayprosUrl):i({title:"Lien de paiement indisponible",description:"Aucun lien de paiement n'a été renvoyé.",variant:"destructive"})},onError:t=>{const r=/signature verification failed/i.test(String(t.message||"")),n=/ppaypros/i.test(String(t.message||""));i({title:r?"Paiement refusé":"Erreur de paiement",description:r?"Une erreur de configuration a empêché le paiement. Réessayez plus tard ou contactez le service client.":n?"Impossible de préparer le paiement. Réessayez ou contactez le service client.":t.message,variant:"destructive"})}}),le=w({mutationFn:async()=>{const t=await y("POST","/api/deposits",{amount:Number(o),accountName:d?.fullName||"",accountNumber:d?.phone||"",paymentMethod:"InPay",country:u,useInpay:!0});if(!t.ok){const r=await t.json();throw new Error(r.message||"Erreur InPay")}return t.json()},onSuccess:t=>{t.inpayUrl&&(window.location.href=t.inpayUrl)},onError:t=>i({title:`Erreur ${lt}`,description:t.message,variant:"destructive"})}),P=w({mutationFn:async t=>{if(!L||!$.trim())throw new Error("Sélectionnez un opérateur et saisissez votre numéro");const r=await y("POST","/api/ashtechpay/collect",{amount:Number(o),country:De,operator:L,phone:$.trim(),depositId:A||void 0,otp:t||void 0});if(!r.ok){const n=await r.json();throw new Error(n.message||"Erreur AshtechPay")}return r.json()},onSuccess:t=>{D(t.depositId),Ie(t.message||""),Me(t.ussdCode||""),t.waveUrl?(nt(t.waveUrl),a("ashtech-redirect")):t.requiresOtp?a("ashtech-otp"):(T(!0),V(t.status||"pending"),a("ashtech-waiting"))},onError:t=>{if(t.data?.requiresOtp){D(t.data.depositId||A),Me(t.data.ussdCode||""),Ie(t.message||"Composez le code indiqué puis saisissez le code OTP."),Ee(""),a("ashtech-otp");return}i({title:`Erreur ${Ue}`,description:t.message,variant:"destructive"})}}),de=w({mutationFn:async()=>{if(!g)throw new Error("Sélectionnez un opérateur");const t=await y("POST","/api/sendavapay/create",{amount:Number(o),country:k,operatorId:g.id,operatorName:g.name,payerPhone:X});if(!t.ok){const v=await t.json();throw new Error(v.message||"Erreur création paiement")}const r=await t.json();q(r.depositId),F(r.paymentToken);const n=await y("POST","/api/sendavapay/initiate",{paymentToken:r.paymentToken,payerCountry:k,operatorId:g.id,depositId:r.depositId,payerPhone:X});if(!n.ok){const v=await n.json();throw new Error(v.message||"Erreur initiation paiement")}return n.json()},onSuccess:t=>{const r=g?.name?.toLowerCase().includes("wave");t.requiresRedirect&&t.redirectUrl&&r?(et(t.redirectUrl),a("sv-redirect")):t.requiresRedirect&&!r?(f(!0),a("sv-waiting")):t.requiresOtp&&t.otpToken?(ee(t.otpToken),Ze(t.ussdCode||""),Xe(t.message||""),a("sv-otp")):t.success?(f(!0),a("sv-waiting")):i({title:"Erreur",description:t.error||t.message||"Erreur paiement",variant:"destructive"})},onError:t=>i({title:"Erreur",description:t.message,variant:"destructive"})}),pe=w({mutationFn:async()=>{if(!Y)throw new Error("Token de paiement manquant");const t=await y("POST","/api/sendavapay/retry",{paymentToken:Y,depositId:R});if(!t.ok){const r=await t.json();throw new Error(r.message||"Erreur retry")}return t.json()},onSuccess:()=>{re(""),ee(""),O(""),f(!1),a("sv-operator"),i({title:"Prêt à réessayer",description:"Sélectionnez un opérateur et relancez le paiement."})},onError:t=>i({title:"Erreur retry",description:t.message,variant:"destructive"})}),me=w({mutationFn:async()=>{const t=await y("POST","/api/sendavapay/submit-otp",{otpToken:Je,otp:te});if(!t.ok){const r=await t.json();throw new Error(r.message||"Erreur OTP")}return t.json()},onSuccess:()=>{f(!0),a("sv-waiting")},onError:t=>i({title:"Erreur OTP",description:t.message,variant:"destructive"})}),wt=()=>{if(!o||Number(o)<ne){i({title:"Montant invalide",description:`Le minimum est de ${ne.toLocaleString()} ${p}`,variant:"destructive"});return}if(Te&&(!Number.isInteger(Number(o))||Number(o)%5!==0)){i({title:"Montant InPay invalide",description:"Utilisez un montant entier multiple de 5 : 300, 305, 310…",variant:"destructive"});return}if(ie&&!Number.isInteger(Number(o))){i({title:"Montant invalide",description:"Ce paiement accepte uniquement un montant entier en FCFA.",variant:"destructive"});return}We()},We=()=>{if(!N){i({title:"Pays requis",description:"Sélectionnez le pays du paiement.",variant:"destructive"});return}if(ie){if(d?.country?.toUpperCase()!=="BJ"){i({title:"Compte non béninois",description:"Le paiement utilise le numéro béninois enregistré sur le compte.",variant:"destructive"});return}if(!_e(d?.phone)){i({title:"Numéro du compte invalide",description:"Le numéro enregistré doit être un numéro béninois; les 8 chiffres locaux sont complétés automatiquement avec 01.",variant:"destructive"});return}ce.mutate();return}if(Te){le.mutate();return}if(ot){S.mutate();return}he(`/robotpay?amount=${encodeURIComponent(Number(o))}&country=${encodeURIComponent(N)}`)},Nt=t=>{const r=t.toLowerCase();return r.includes("tmoney")||r.includes("t-money")?"/operators/tmoney.png":r.includes("moov")?"/operators/moov.jpg":r.includes("orange")?"/operators/orange.png":r.includes("mtn")?"/operators/mtn.png":r.includes("airtel")?"/operators/airtel.png":r.includes("wave")?"/operators/wave.png":null},Ct=()=>{if(!Z.trim()){i({title:"Numéro requis",description:"Entrez le numéro depuis lequel vous avez payé",variant:"destructive"});return}if(!C){i({title:"Capture requise",description:"Veuillez joindre la capture d'écran du paiement",variant:"destructive"});return}oe.mutate()};return d?c==="amount"?e.jsxs("main",{className:"recharge-reference min-h-screen bg-[#f7f6f3]",children:[e.jsx("style",{children:`
        .recharge-reference {
          color: #202124;
          font-family: Inter, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          width: 100%;
          max-width: 500px;
          min-height: 100vh;
          margin: 0 auto;
          overflow: hidden;
          padding-bottom: 28px;
          background: #f7f6f3;
        }
        .recharge-reference .recharge-topbar {
          position: relative;
          display: flex;
          height: 44px;
          align-items: center;
          justify-content: flex-start;
          background: transparent;
          color: white;
        }
        .recharge-reference .recharge-back {
          position: absolute;
          top: 2px;
          left: 15px;
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          color: white;
        }
        .recharge-reference .recharge-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 500;
        }
        .recharge-reference .brand-mark {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }
        .recharge-reference .history-button {
          position: absolute;
          top: 8px;
          right: 14px;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.15);
        }
        .recharge-reference .recharge-hero {
          position: relative;
          display: flex;
          height: 124px;
          align-items: center;
          margin: 16px 18px 0;
          padding: 0 18px;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,.8);
          border-radius: 24px 24px 0 0;
          background: ${x};
          color: white;
        }
        .recharge-reference .minimum-label {
          position: relative;
          z-index: 1;
          max-width: 75%;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.4;
        }
        .recharge-reference .gift-illustration {
          position: absolute;
          right: 12px;
          bottom: -8px;
          font-size: 76px;
          line-height: 1;
          filter: drop-shadow(0 3px 2px rgba(0,0,0,.18));
          pointer-events: none;
        }
        .recharge-reference .balance-card {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 96px;
          align-items: center;
          justify-content: center;
          margin: -23px 18px 20px;
          border-radius: 24px;
          background: white;
          box-shadow: 0 2px 8px rgba(24,37,49,.04);
          color: #777;
          font-size: 17px;
        }
        .recharge-reference .balance-value {
          margin-left: 7px;
          color: #df8a12;
          font-size: 22px;
          font-weight: 700;
        }
        .recharge-reference .amount-panel {
          margin: 0 18px 18px;
          padding: 12px 14px;
          border-radius: 15px;
          background: white;
        }
        .recharge-reference .amount-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 2px 0 8px;
          border-bottom: 1px solid #dedede;
          color: #292929;
          font-size: 17px;
          font-weight: 500;
        }
        .recharge-reference .amount-heading-icon {
          display: block;
          flex: 0 0 auto;
          width: 28px;
          height: 28px;
          object-fit: contain;
          filter: invert(1) grayscale(1) contrast(1.2);
        }
        .recharge-reference .preset-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px 8px;
          margin-top: 10px;
        }
        .recharge-reference .preset {
          min-width: 0;
          height: 46px;
          border: 1px solid #a8a8a8;
          border-radius: 7px;
          background: white;
          color: #343434;
          font-size: 18px;
          font-weight: 500;
        }
        .recharge-reference .preset.active {
          border-color: ${Be};
          background: ${x};
          color: white;
          box-shadow: 0 2px 4px rgba(0,84,145,.15);
        }
        .recharge-reference .amount-input {
          display: flex;
          height: 48px;
          align-items: center;
          overflow: hidden;
          margin-top: 10px;
          border: 1px solid #c9c9c9;
          border-radius: 5px;
          background: white;
        }
        .recharge-reference .amount-input input {
          width: 100%;
          height: 100%;
          min-width: 0;
          padding: 0 12px;
          border: 0;
          outline: 0;
          color: #30323b;
          background: transparent;
          font-size: 17px;
        }
        .recharge-reference .amount-input input::placeholder { color: #777; opacity: 1; }
        .recharge-reference .currency-prefix {
          flex: 0 0 auto;
          padding: 0 10px 0 13px;
          color: #30323b;
          font-size: 18px;
        }
        .recharge-reference .country-panel {
          margin: 0 18px 16px;
          padding: 14px;
          border-radius: 15px;
          background: white;
        }
        .recharge-reference .country-label {
          display: block;
          margin-bottom: 8px;
          color: #292929;
          font-size: 15px;
          font-weight: 600;
        }
        .recharge-reference .country-select {
          width: 100%;
          height: 48px;
          padding: 0 12px;
          border: 1px solid #c9c9c9;
          border-radius: 6px;
          background: white;
          color: #30323b;
          font-size: 15px;
        }
        .recharge-reference .continue {
          display: flex;
          width: calc(100% - 36px);
          height: 60px;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          border: 0;
          border-radius: 32px;
          background: ${x};
          color: white;
          font-size: 21px;
          font-weight: 500;
          box-shadow: 0 3px 5px rgba(233,168,0,.35);
        }
        .recharge-reference .continue:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        .recharge-reference .instructions {
          margin: 0 18px;
          padding: 17px 14px 14px;
          border-radius: 15px;
          background: white;
          color: #292929;
        }
        .recharge-reference .instructions-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 16px;
          font-weight: 700;
        }
        .recharge-reference .instruction {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 400;
          line-height: 1.45;
        }
        .recharge-reference .instruction:last-child { margin-bottom: 0; }
        .recharge-reference .instruction-number { font-weight: 500; }
        @media (max-width: 380px) {
          .recharge-reference .amount-panel,
          .recharge-reference .country-panel,
          .recharge-reference .instructions { margin-right: 14px; margin-left: 14px; }
          .recharge-reference .preset-grid { gap: 6px; }
          .recharge-reference .preset { height: 44px; font-size: 17px; }
          .recharge-reference .continue { width: calc(100% - 28px); }
          .recharge-reference .instructions { padding: 15px 12px; }
        }

        .recharge-reference {
          color: #f5f0e3;
          background: #111111;
          font-family: Georgia, "Times New Roman", serif;
        }
        .recharge-reference .recharge-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100vh;
          padding: 24px 0 28px;
          overflow-x: hidden;
          background: #111111;
        }
        .recharge-reference .recharge-top-row {
          display: grid;
          grid-template-columns: 34.5% 57.5%;
          column-gap: 4%;
          align-items: start;
          width: 100%;
          margin: 0 0 26px 4%;
        }
        .recharge-reference .balance-summary {
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: flex-start;
          padding-top: 16px;
        }
        .recharge-reference .balance-label {
          color: #d7d4d0;
          font-size: clamp(15px, 3.2vw, 17px);
          line-height: 1.2;
        }
        .recharge-reference .balance-summary .balance-value {
          margin: 7px 0 0;
          color: #f4f0e9;
          font-size: clamp(17px, 3.6vw, 19px);
          line-height: 1.2;
          font-weight: 700;
        }
        .recharge-reference .wallet-link {
          display: flex;
          width: 132px;
          max-width: 100%;
          min-height: 46px;
          align-items: center;
          margin-top: 24px;
          padding: 6px 12px;
          border-radius: 24px;
          background: #24232f;
          color: #f4f0e3;
          font-size: clamp(16px, 3.5vw, 18px);
          font-weight: 700;
          line-height: 1;
          text-decoration: none;
        }
        .recharge-reference .recharge-promo {
          width: 100%;
          aspect-ratio: 496 / 280;
          overflow: hidden;
          border-radius: 18px;
          background-color: #efbc34;
          background-image: url("${Lt}");
          background-repeat: no-repeat;
          background-position: 100% 7.11%;
          background-size: 174.19% 617.14%;
        }
        .recharge-reference .amount-panel {
          margin: 0 4% 18px;
          padding: 26px 2.75% 20px;
          border-radius: 24px;
          background: #24232f;
          color: #f7f0dc;
        }
        .recharge-reference .preset-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 25px 7.5%;
          margin-top: 0;
        }
        .recharge-reference .preset {
          height: clamp(46px, 10.55vw, 54px);
          border: 0;
          border-radius: 999px;
          background: #fff0c8;
          color: #302b24;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(16px, 3.5vw, 18px);
          font-weight: 400;
        }
        .recharge-reference .preset.active {
          border: 0;
          background: #e9c45e;
          color: #302b24;
          box-shadow: none;
        }
        .recharge-reference .amount-input {
          height: clamp(58px, 12.9vw, 66px);
          margin-top: 25px;
          border: 0;
          border-radius: 999px;
          background: #fff0c8;
        }
        .recharge-reference .amount-input input {
          padding: 0 16px 0 4px;
          color: #292722;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(17px, 3.5vw, 19px);
          font-weight: 700;
        }
        .recharge-reference .amount-input input::placeholder {
          color: #817b70;
          font-weight: 400;
        }
        .recharge-reference .currency-prefix {
          padding: 0 12px 0 20px;
          color: #292722;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(16px, 3.3vw, 18px);
          font-weight: 700;
        }
        .recharge-reference .country-panel {
          margin: 22px 0 0;
          padding: 0;
          border-radius: 0;
          background: transparent;
        }
        .recharge-reference .country-label {
          margin-bottom: 12px;
          color: #f5f0e3;
          font-size: clamp(16px, 3.5vw, 18px);
          font-weight: 400;
        }
        .recharge-reference .country-select {
          height: 48px;
          padding: 0 42px 0 18px;
          appearance: none;
          border: 0;
          border-radius: 999px;
          background-color: #fff0c8;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23302b24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 18px center;
          color: #302b24;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(15px, 3.2vw, 17px);
        }
        .recharge-reference .continue {
          width: 100%;
          height: clamp(58px, 12.9vw, 66px);
          margin: 58px 0 0;
          border: 0;
          border-radius: 999px;
          background: #e9c45e;
          color: #302b24;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(18px, 3.7vw, 20px);
          font-weight: 700;
          box-shadow: none;
        }
        .recharge-reference .continue:disabled {
          opacity: .58;
        }
        .recharge-reference .instructions {
          margin: 24px 0 0;
          padding: 0;
          border-radius: 0;
          background: transparent;
          color: #f5f0e3;
        }
        .recharge-reference .instructions-title {
          margin: 0 0 16px;
          color: #f4f0e3;
          font-size: clamp(17px, 3.5vw, 19px);
          font-weight: 700;
          line-height: 1.3;
        }
        .recharge-reference .instructions-subtitle {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 20px;
          color: #f1d11b;
          font-size: clamp(17px, 3.5vw, 19px);
          font-weight: 700;
        }
        .recharge-reference .instructions-subtitle svg {
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
        }
        .recharge-reference .instruction {
          margin: 0 0 14px;
          color: #f3f0ed;
          font-size: clamp(15px, 3.5vw, 18px);
          line-height: 1.48;
        }
        .recharge-reference .instruction-number {
          color: #f1d11b;
          font-weight: 700;
        }
        .recharge-reference .instruction strong {
          color: #f1d11b;
          font-weight: 700;
        }
        @media (max-width: 380px) {
          .recharge-reference .amount-panel {
            margin-right: 4%;
            margin-left: 4%;
            padding-right: 2.75%;
            padding-left: 2.75%;
          }
          .recharge-reference .preset-grid {
            gap: 20px 6%;
          }
          .recharge-reference .continue {
            width: 100%;
          }
        }
      `}),e.jsxs("div",{className:"recharge-screen",children:[e.jsx("header",{className:"recharge-topbar",children:e.jsx("button",{type:"button",className:"recharge-back",onClick:()=>he("/account"),"aria-label":"Retour","data-testid":"button-back-deposit",children:e.jsx(h,{className:"h-6 w-6","aria-hidden":"true"})})}),e.jsxs("div",{className:"recharge-top-row",children:[e.jsxs("section",{className:"balance-summary","aria-label":"Solde actuel",children:[e.jsx("span",{className:"balance-label",children:"Solde actuel"}),e.jsxs("strong",{className:"balance-value",children:[Number.parseFloat(d.balance||"0").toLocaleString("fr-FR",{maximumFractionDigits:2})," ",p]}),e.jsx(z,{href:"/history",className:"wallet-link",children:"Mon portefeuille"})]}),e.jsx("div",{className:"recharge-promo",role:"img","aria-label":"Sélectionnez une valeur rapide"})]}),e.jsxs("section",{className:"amount-panel","aria-label":"Montant de recharge",children:[e.jsx("div",{className:"preset-grid",children:[3e3,3500,7e3,15e3,3e4,5e4,1e5,2e5,5e5].map(t=>e.jsx("button",{className:`preset ${o===t?"active":""}`,onClick:()=>j(t),"aria-pressed":o===t,children:t},t))}),e.jsxs("label",{className:"amount-input",children:[e.jsx("span",{className:"currency-prefix",children:p}),e.jsx("input",{type:"number",inputMode:"numeric",value:o,onChange:t=>j(t.target.value?Number(t.target.value):""),placeholder:"Saisir un autre montant","aria-label":"Montant de recharge"})]}),e.jsxs("section",{className:"country-panel","aria-label":"Pays du paiement",children:[e.jsx("label",{htmlFor:"deposit-country",className:"country-label",children:"Pays du paiement"}),e.jsxs("select",{id:"deposit-country",value:N,onChange:t=>{fe(t.target.value)},className:"country-select",children:[e.jsx("option",{value:"",children:"Sélectionnez un pays"}),B.map(t=>e.jsxs("option",{value:t.code,children:[t.name," (",t.currency,")"]},t.code))]})]}),e.jsx("button",{className:"continue",onClick:wt,disabled:!N||le.isPending||S.isPending||ce.isPending,children:le.isPending||S.isPending||ce.isPending?"Chargement…":ie?"Payer":"Recharger"}),e.jsxs("section",{className:"instructions","aria-label":"Instructions de recharge",children:[e.jsx("h2",{className:"instructions-title",children:"Avis de dépôt."}),e.jsxs("div",{className:"instructions-subtitle",children:[e.jsx(It,{"aria-hidden":"true"}),e.jsx("span",{children:"Instructions de recharge"})]}),e.jsxs("p",{className:"instruction",children:[e.jsx("span",{className:"instruction-number",children:"1."})," Montant minimum de recharge : ",e.jsxs("strong",{children:[ne.toLocaleString("fr-FR")," ",p]}),"."]}),e.jsxs("p",{className:"instruction",children:[e.jsx("span",{className:"instruction-number",children:"2."})," Le service de recharge est disponible 24h/24 et 7j/7. Vous pouvez soumettre une demande de recharge à tout moment."]}),e.jsxs("p",{className:"instruction",children:[e.jsx("span",{className:"instruction-number",children:"3."})," Avant chaque recharge, vérifiez les dernières informations du compte de réception affichées sur la plateforme."]}),e.jsxs("p",{className:"instruction",children:[e.jsx("span",{className:"instruction-number",children:"4."})," Après le paiement, le système traite généralement la transaction dans un délai ",e.jsx("strong",{children:"de 10 à 30 minutes"}),"."]}),e.jsxs("p",{className:"instruction",children:[e.jsx("span",{className:"instruction-number",children:"5."})," Effectuez vos rechargements et transactions uniquement via l’application officielle de la plateforme."]})]})]})]})]}):c==="select"?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsxs("header",{className:"flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4",children:[e.jsxs("button",{className:"flex items-center gap-1 text-gray-800",onClick:()=>a("amount"),children:[e.jsx(h,{className:"h-5 w-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Choisir le pays"})]}),e.jsx(z,{href:"/history",children:e.jsx("button",{className:"rounded-full border border-[#00CC2C] px-3 py-1.5 text-xs font-semibold text-[#00CC2C]",children:"Historique"})})]}),e.jsxs("div",{className:"mx-4 mt-4 flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#00CC2C]",children:[Number(o).toLocaleString()," FCFA"]})]}),e.jsx("button",{onClick:()=>a("amount"),className:"text-xs text-[#00CC2C] underline",children:"Modifier"})]}),e.jsxs("div",{className:"p-4",children:[e.jsxs("div",{className:"rounded-2xl border-2 border-[#00CC2C] bg-green-50 p-4",children:[e.jsx("p",{className:"mb-2 text-sm font-bold text-gray-900",children:"Pays du paiement"}),e.jsxs("select",{value:N,onChange:t=>fe(t.target.value),className:"w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-4 text-sm text-gray-700 outline-none",children:[e.jsx("option",{value:"",children:"Sélectionnez un pays"}),B.map(t=>e.jsxs("option",{value:t.code,children:[t.name," (",t.currency,")"]},t.code))]}),e.jsx("p",{className:"mt-2 text-xs text-gray-500",children:"Seuls les pays activés par l’administration sont affichés."})]}),e.jsx("button",{onClick:We,disabled:!N,className:"mt-5 w-full rounded-xl bg-[#00CC2C] py-3 font-semibold text-white disabled:opacity-50",children:"Continuer vers le paiement"})]})]}):c==="form"&&l?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx("header",{className:"flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100",children:e.jsxs("button",{className:"flex items-center gap-1 text-gray-800",onClick:()=>a("select"),children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Confirmer le paiement"})]})}),e.jsxs("div",{className:"p-4 space-y-4 pb-10",children:[e.jsxs("div",{className:"rounded-xl border border-orange-100 bg-orange-50 p-4 flex items-center gap-3",children:[l.logoUrl?e.jsx("img",{src:l.logoUrl,alt:l.operatorName,className:"w-10 h-10 rounded-lg object-contain"}):e.jsx("div",{className:"w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-orange-100",children:e.jsx(K,{className:"w-5 h-5 text-[#00CC2C]"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"text-xs text-gray-500",children:l.paymentLink?"Lien de paiement":"Numéro destinataire"}),l.paymentLink?e.jsxs("a",{href:l.paymentLink,target:"_blank",rel:"noreferrer",className:"mt-1 flex items-center gap-1 text-sm font-bold text-[#00CC2C] underline",children:[e.jsx(E,{className:"h-4 w-4"})," Ouvrir le lien de paiement"]}):e.jsxs("p",{className:"font-bold text-[#00CC2C] text-sm",children:[l.operatorName," — ",l.phone]}),e.jsx("p",{className:"text-xs text-gray-500",children:l.ownerName})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant"}),e.jsxs("p",{className:"font-bold text-gray-800",children:[Number(o).toLocaleString()," ",p]})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Votre numéro payeur"}),e.jsxs("div",{className:"border border-gray-300 rounded-md flex items-center overflow-hidden bg-white",children:[e.jsx(K,{className:"w-4 h-4 text-gray-400 ml-4"}),e.jsx("input",{type:"tel",value:Z,onChange:t=>be(t.target.value),placeholder:"Numéro depuis lequel vous avez payé",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Référence / ID transaction ",e.jsx("span",{className:"text-gray-400 font-normal",children:"(optionnel)"})]}),e.jsx("input",{type:"text",value:Ne,onChange:t=>Ce(t.target.value),placeholder:"Numéro de référence de la transaction",className:"w-full border border-gray-300 rounded-md px-4 py-4 text-sm text-gray-700 outline-none bg-white"})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Message reçu après paiement ",e.jsx("span",{className:"text-gray-400 font-normal",children:"(optionnel)"})]}),e.jsx("textarea",{value:ve,onChange:t=>we(t.target.value),placeholder:"Collez ici le SMS ou message de confirmation reçu...",rows:3,className:"w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 outline-none bg-white resize-none"})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Capture d'écran du paiement ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("input",{ref:ge,type:"file",accept:"image/*",onChange:yt,className:"hidden"}),e.jsx("button",{onClick:()=>ge.current?.click(),className:`w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors ${C?"border-green-400 bg-green-50":"border-gray-300 bg-gray-50 hover:border-[#00CC2C] hover:bg-green-50"}`,children:C?e.jsxs(e.Fragment,{children:[e.jsx(H,{className:"w-8 h-8 text-green-500"}),e.jsx("p",{className:"text-sm font-medium text-green-600",children:Ke}),e.jsx("p",{className:"text-xs text-gray-400",children:"Appuyez pour changer"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Et,{className:"w-8 h-8 text-gray-400"}),e.jsx("p",{className:"text-sm font-medium text-gray-600",children:"Appuyez pour ajouter la capture"}),e.jsx("p",{className:"text-xs text-gray-400",children:"JPG, PNG — max 5 Mo"})]})}),C&&e.jsx("div",{className:"mt-3 rounded-xl overflow-hidden border border-gray-100",children:e.jsx("img",{src:C,alt:"Capture",className:"w-full max-h-52 object-contain bg-gray-50"})})]}),e.jsx("button",{onClick:Ct,disabled:oe.isPending,className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg disabled:opacity-50",style:{background:x},children:oe.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(b,{className:"w-5 h-5 animate-spin"})," Envoi en cours..."]}):e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(Ot,{className:"w-5 h-5"})," Soumettre ma demande"]})})]})]}):c==="westpay"?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx("header",{className:"flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100",children:e.jsxs("button",{className:"flex items-center gap-1 text-gray-800",onClick:()=>a("select"),children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:W})]})}),e.jsxs("div",{className:"p-4 space-y-5 pb-10",children:[e.jsxs("div",{className:"mx-0 rounded-xl p-4 border border-orange-100 bg-orange-50 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#00CC2C]",children:[Number(o).toLocaleString()," ",p]})]}),e.jsx("button",{onClick:()=>a("amount"),className:"text-xs text-[#00CC2C] underline",children:"Modifier"})]}),e.jsxs("div",{className:"rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Mt,{className:"w-5 h-5 text-[#00CC2C]"}),e.jsx("p",{className:"font-semibold text-gray-900 text-sm",children:"Comment ça marche ?"})]}),e.jsxs("p",{className:"text-xs text-gray-600 leading-relaxed",children:["1. Cliquez ",e.jsxs("strong",{children:["Payer avec ",W]})," — vous serez redirigé vers la page de paiement sécurisée."]}),e.jsx("p",{className:"text-xs text-gray-600 leading-relaxed",children:"2. Entrez votre numéro Mobile Money et validez le paiement USSD depuis votre téléphone."}),e.jsx("p",{className:"text-xs text-gray-600 leading-relaxed",children:"3. Après paiement, vous serez automatiquement redirigé ici. Votre solde est crédité après confirmation."})]}),e.jsx("button",{onClick:()=>S.mutate(),disabled:S.isPending,className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg disabled:opacity-40 flex items-center justify-center gap-2",style:{background:x},children:S.isPending?e.jsxs(e.Fragment,{children:[e.jsx(b,{className:"w-5 h-5 animate-spin"})," Redirection en cours..."]}):e.jsxs(e.Fragment,{children:[e.jsx(E,{className:"w-5 h-5"})," Payer avec ",W]})}),e.jsxs("p",{className:"text-xs text-center text-gray-400",children:["Paiement sécurisé via ",W," — USSD Mobile Money"]})]})]}):c==="ashtech-operator"?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsxs("header",{className:"flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100",children:[e.jsxs("button",{className:"flex items-center gap-1 text-gray-800",onClick:()=>a("select"),children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:Ue})]}),e.jsx(z,{href:"/history",children:e.jsx("button",{className:"text-xs text-[#00CC2C] font-semibold px-3 py-1.5 rounded-full border border-[#00CC2C]",children:"Historique"})})]}),e.jsxs("div",{className:"mx-4 mt-4 rounded-xl p-4 border border-orange-100 bg-orange-50 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#00CC2C]",children:[Number(o).toLocaleString()," ",p]})]}),e.jsx("button",{onClick:()=>a("amount"),className:"text-xs text-[#00CC2C] underline",children:"Modifier"})]}),e.jsxs("div",{className:"p-4 space-y-4 pb-10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Pays"}),ft?e.jsx(b,{className:"w-6 h-6 animate-spin text-[#00CC2C] mx-auto"}):Fe?e.jsxs("div",{className:"rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700",children:[e.jsx("p",{children:"Impossible de charger les pays et opérateurs AshtechPay."}),e.jsx("button",{type:"button",onClick:()=>{bt()},className:"mt-2 font-semibold underline",children:"Réessayer"})]}):G.length===0?e.jsx(ue,{size:"compact",className:"text-sm text-gray-400 text-center py-5",children:"Aucun pays AshtechPay actif n’est disponible."}):e.jsx("select",{value:De,onChange:t=>{rt(t.target.value),ze("")},className:"w-full border border-gray-300 rounded-md px-4 py-4 text-sm text-gray-700 outline-none bg-white appearance-none",children:G.map(t=>e.jsxs("option",{value:t.code,children:[t.name," (",t.currency,")"]},t.code))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Numéro Mobile Money"}),e.jsxs("div",{className:"border border-gray-300 rounded-md flex items-center overflow-hidden bg-white",children:[e.jsx(K,{className:"w-4 h-4 text-gray-400 ml-4 flex-shrink-0"}),e.jsx("input",{type:"tel",inputMode:"numeric",value:$,onChange:t=>st(t.target.value),placeholder:"Votre numéro Mobile Money",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Opérateur Mobile Money"}),Fe?null:Ve.length===0?e.jsx(ue,{size:"compact",className:"text-sm text-gray-400 text-center py-5",children:"Aucun opérateur disponible pour ce pays"}):e.jsx("div",{className:"space-y-2",children:Ve.map((t,r)=>{const n=typeof t=="string"?t:t.name||t.code||`Opérateur ${r+1}`;return e.jsxs("button",{onClick:()=>ze(n),className:`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 ${L===n?"border-[#00CC2C] bg-green-50":"border-gray-200 bg-white"}`,children:[e.jsx("span",{className:"font-semibold text-gray-900 text-sm",children:n}),L===n&&e.jsx(H,{className:"w-5 h-5 text-[#00CC2C]"})]},`${n}-${r}`)})})]}),e.jsx("button",{onClick:()=>P.mutate(void 0),disabled:!L||!$.trim()||P.isPending,className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg disabled:opacity-40",style:{background:x},children:P.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(b,{className:"w-5 h-5 animate-spin"})," Initiation en cours..."]}):"Initier le paiement"})]})]}):c==="ashtech-otp"?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx("header",{className:"flex items-center gap-2 px-4 py-4 bg-white border-b border-gray-100",children:e.jsxs("button",{onClick:()=>a("ashtech-operator"),className:"flex items-center gap-1 text-gray-800",children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Code OTP"})]})}),e.jsxs("div",{className:"p-4 space-y-5 pb-10",children:[e.jsxs("div",{className:"rounded-2xl border-2 border-orange-200 bg-orange-50 p-4",children:[e.jsx("p",{className:"font-bold text-gray-900 text-sm mb-2",children:"Code à composer"}),ae&&e.jsx("p",{className:"bg-white rounded-xl border border-orange-200 px-4 py-3 text-center font-mono font-black text-2xl text-[#00CC2C] tracking-widest",children:ae}),e.jsx("p",{className:"text-sm text-gray-600 mt-3",children:ae?"Composez ce code sur votre téléphone pour obtenir le code OTP, puis saisissez-le ci-dessous.":"Un code OTP vous a été envoyé. Saisissez-le ci-dessous."})]}),e.jsx("input",{type:"text",inputMode:"numeric",value:se,onChange:t=>Ee(t.target.value),maxLength:8,placeholder:"Code OTP reçu par SMS",className:"w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none bg-white focus:border-[#00CC2C]"}),e.jsx("button",{onClick:()=>P.mutate(se),disabled:!se.trim()||P.isPending,className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg disabled:opacity-40",style:{background:x},children:P.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(b,{className:"w-5 h-5 animate-spin"})," Vérification..."]}):"Valider le code OTP"})]})]}):c==="ashtech-redirect"?e.jsxs("div",{className:"min-h-screen bg-white flex flex-col",children:[e.jsx("header",{className:"flex items-center gap-2 px-4 py-4 bg-white border-b border-gray-100",children:e.jsxs("button",{onClick:()=>a("ashtech-operator"),className:"flex items-center gap-1 text-gray-800",children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Finaliser le paiement"})]})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center",children:e.jsx(E,{className:"w-10 h-10 text-[#00CC2C]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl mb-2",children:"Finaliser avec Wave"}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Ouvrez la page Wave pour confirmer votre dépôt de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]}),"."]})]}),e.jsxs("a",{href:at,target:"_blank",rel:"noopener noreferrer",onClick:()=>{T(!0),a("ashtech-waiting")},className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg flex items-center justify-center gap-2",style:{background:x},children:[e.jsx(E,{className:"w-5 h-5"})," Ouvrir Wave"]})]})]}):c==="ashtech-waiting"?e.jsxs("div",{className:"min-h-screen bg-white flex flex-col",children:[e.jsx("header",{className:"flex items-center gap-2 px-4 py-4 bg-white border-b border-gray-100",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Paiement en cours"})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center",children:e.jsx(Q,{className:"w-10 h-10 text-[#00CC2C] animate-spin",style:{animationDuration:"2s"}})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"En attente de confirmation"}),e.jsx("p",{className:"text-sm text-gray-500 mt-2",children:"Validez le paiement sur votre téléphone. Cette page se met à jour automatiquement."})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(z,{href:"/history",className:"flex-1",children:e.jsx("button",{className:"w-full py-3 rounded-full border border-[#00CC2C] text-[#00CC2C] font-semibold text-sm",children:"Voir l'historique"})}),e.jsx("button",{onClick:()=>{a("amount"),j(""),D(null),T(!1),V("")},className:"flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm",children:"Nouvelle recharge"})]})]})]}):c==="sv-operator"?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsxs("header",{className:"flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100",children:[e.jsxs("button",{className:"flex items-center gap-1 text-gray-800",onClick:()=>a("amount"),children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Top up"})]}),e.jsx(z,{href:"/history",children:e.jsx("button",{className:"text-xs text-[#00CC2C] font-semibold px-3 py-1.5 rounded-full border border-[#00CC2C]",children:"Historique"})})]}),e.jsxs("div",{className:"mx-4 mt-4 rounded-xl p-4 border border-orange-100 bg-orange-50 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#00CC2C]",children:[Number(o).toLocaleString()," ",p]})]}),e.jsx("button",{onClick:()=>a("amount"),className:"text-xs text-[#00CC2C] underline",children:"Modifier"})]}),e.jsxs("div",{className:"p-4 space-y-4 pb-10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Pays"}),e.jsx("select",{value:k,onChange:t=>{Qe(t.target.value),I(null)},className:"w-full border border-gray-300 rounded-md px-4 py-4 text-sm text-gray-700 outline-none bg-white appearance-none",children:B.map(t=>e.jsx("option",{value:t.code,children:t.name},t.code))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Numéro Mobile Money"}),e.jsxs("div",{className:"border border-gray-300 rounded-md flex items-center overflow-hidden bg-white",children:[e.jsx(K,{className:"w-4 h-4 text-gray-400 ml-4 flex-shrink-0"}),e.jsx("input",{type:"tel",inputMode:"numeric",value:X,onChange:t=>He(t.target.value),placeholder:"Numéro sur lequel envoyer la demande",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Opérateur Mobile Money"}),ht?e.jsx("div",{className:"flex items-center justify-center py-8",children:e.jsx(b,{className:"w-6 h-6 animate-spin text-[#00CC2C]"})}):qe.length===0?e.jsx("div",{className:"text-center py-8 text-gray-400",children:e.jsx(ue,{size:"compact",className:"text-sm",children:"Aucun opérateur disponible pour ce pays"})}):e.jsx("div",{className:"space-y-2",children:qe.map(t=>{const r=Nt(t.name);return e.jsxs("button",{onClick:()=>I(t),className:`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all ${g?.id===t.id?"border-[#00CC2C] bg-green-50":"border-gray-200 bg-white hover:border-green-200"}`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[r?e.jsx("img",{src:r,alt:t.name,className:"w-10 h-10 rounded-full object-cover border border-gray-100"}):e.jsx("div",{className:`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${g?.id===t.id?"bg-[#00CC2C] text-white":"bg-gray-100 text-gray-600"}`,children:t.name.charAt(0)}),e.jsxs("div",{className:"text-left",children:[e.jsx("p",{className:"font-semibold text-gray-900 text-sm",children:t.name}),t.requiresOtp&&e.jsx("p",{className:"text-xs text-[#00CC2C]",children:"Code OTP requis"})]})]}),g?.id===t.id&&e.jsx(H,{className:"w-5 h-5 text-[#00CC2C]"})]},t.id)})})]}),e.jsx("button",{onClick:()=>de.mutate(),disabled:!g||de.isPending,className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg disabled:opacity-40",style:{background:x},children:de.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(b,{className:"w-5 h-5 animate-spin"})," Initiation en cours..."]}):e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx("img",{src:"/topup-icon.png",className:"w-6 h-6 object-contain",alt:"topup"})," Initier le paiement"]})})]})]}):c==="sv-otp"?e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx("header",{className:"flex items-center gap-2 px-4 py-4 bg-white border-b border-gray-100",children:e.jsxs("button",{onClick:()=>a("sv-operator"),className:"flex items-center gap-1 text-gray-800",children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Code OTP"})]})}),e.jsxs("div",{className:"p-4 space-y-5 pb-10",children:[e.jsxs("div",{className:"rounded-2xl border-2 border-orange-200 bg-orange-50 p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-[#00CC2C] flex items-center justify-center flex-shrink-0",children:e.jsx("span",{className:"text-white font-bold text-xs",children:"1"})}),e.jsx("p",{className:"font-bold text-gray-900 text-sm",children:"Composez ce code sur votre téléphone"})]}),ke?e.jsxs("div",{className:"bg-white rounded-xl border border-orange-200 px-4 py-3 text-center",children:[e.jsx("p",{className:"font-mono font-black text-2xl text-[#00CC2C] tracking-widest",children:ke}),e.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Composez ce code USSD sur votre téléphone"})]}):e.jsxs("p",{className:"text-sm text-gray-600",children:["Composez le code USSD de votre opérateur (ex : ",e.jsx("span",{className:"font-mono font-bold text-[#00CC2C]",children:"*144#"}),") sur votre téléphone pour recevoir le code OTP par SMS."]})]}),e.jsxs("div",{className:"rounded-2xl border-2 border-orange-100 bg-orange-50 p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-[#00CC2C] flex items-center justify-center flex-shrink-0",children:e.jsx("span",{className:"text-white font-bold text-xs",children:"2"})}),e.jsx("p",{className:"font-bold text-gray-900 text-sm",children:"Entrez le code OTP reçu par SMS"})]}),e.jsxs("p",{className:"text-xs text-gray-500 mb-3",children:["Après avoir composé le code, vous recevrez un SMS avec un code OTP. Saisissez-le ci-dessous pour confirmer le paiement de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]}),"."]}),e.jsx("input",{type:"text",inputMode:"numeric",value:te,onChange:t=>re(t.target.value),placeholder:"Code OTP reçu par SMS",className:"w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none bg-white focus:border-[#00CC2C]",maxLength:8})]}),e.jsx("button",{onClick:()=>me.mutate(),disabled:!te.trim()||me.isPending,className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg disabled:opacity-40",style:{background:x},children:me.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(b,{className:"w-5 h-5 animate-spin"})," Vérification..."]}):"Valider le code OTP"})]})]}):c==="sv-redirect"?e.jsxs("div",{className:"min-h-screen bg-white flex flex-col",children:[e.jsx("header",{className:"flex items-center gap-2 px-4 py-4 bg-white border-b border-gray-100",children:e.jsxs("button",{onClick:()=>a("sv-operator"),className:"flex items-center gap-1 text-gray-800",children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Finaliser le paiement"})]})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center",children:e.jsx(E,{className:"w-10 h-10 text-[#00CC2C]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl mb-2",children:"Finaliser sur l'application"}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Appuyez sur le bouton ci-dessous pour ouvrir la page de paiement de l'opérateur et confirmer votre dépôt de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]}),"."]})]}),e.jsxs("a",{href:Ye,target:"_blank",rel:"noopener noreferrer",className:"w-full py-5 rounded-full text-white font-bold text-base shadow-lg flex items-center justify-center gap-2",style:{background:x},onClick:()=>{f(!0),a("sv-waiting")},children:[e.jsx(E,{className:"w-5 h-5"})," Ouvrir la page de paiement"]})]})]}):c==="sv-waiting"?e.jsxs("div",{className:"min-h-screen bg-white flex flex-col",children:[e.jsx("header",{className:"flex items-center gap-2 px-4 py-4 bg-white border-b border-gray-100",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Paiement en cours"})}),e.jsx("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:Se==="approved"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-green-100 flex items-center justify-center",children:e.jsx(H,{className:"w-10 h-10 text-green-500"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Paiement confirmé !"}),e.jsxs("p",{className:"text-sm text-gray-500 mt-1",children:["Votre solde a été crédité de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]})]})]})]}):Se==="rejected"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-red-100 flex items-center justify-center",children:e.jsx(Q,{className:"w-10 h-10 text-red-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Paiement échoué"}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"Le paiement a été refusé ou annulé."})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[Y&&e.jsxs("button",{onClick:()=>pe.mutate(),disabled:pe.isPending,className:"flex-1 py-3 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50",style:{background:x},children:[pe.isPending?e.jsx(b,{className:"w-4 h-4 animate-spin"}):e.jsx(Q,{className:"w-4 h-4"}),"Réessayer"]}),e.jsx("button",{onClick:()=>{a("amount"),j(""),I(null),q(null),F(""),f(!1),O("")},className:"flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm",children:"Nouvelle recharge"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center",children:e.jsx(Q,{className:"w-10 h-10 text-[#00CC2C] animate-spin",style:{animationDuration:"2s"}})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"En attente de confirmation"}),e.jsxs("p",{className:"text-sm text-gray-500 mt-2",children:["Une demande de paiement de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]})," a été envoyée sur votre téléphone.",e.jsx("br",{}),"Acceptez-la sur votre téléphone. Cette page se met à jour automatiquement."]})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(z,{href:"/history",className:"flex-1",children:e.jsx("button",{className:"w-full py-3 rounded-full border border-[#00CC2C] text-[#00CC2C] font-semibold text-sm",children:"Voir l'historique"})}),e.jsx("button",{onClick:()=>{a("amount"),j(""),I(null),q(null),F(""),f(!1),O("")},className:"flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm",children:"Nouvelle recharge"})]})]})})]}):null:null}export{Yt as default};
