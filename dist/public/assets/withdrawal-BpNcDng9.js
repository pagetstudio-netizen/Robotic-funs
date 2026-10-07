import{a as O,b as T,N as D,r as p,u as P,c as m,j as e,L as j,g as z,e as U}from"./index-BbEWZBiu.js";import{u as V}from"./useMutation-C1qTAxz5.js";import{g as B}from"./countries-DOninoG6.js";import{C as K}from"./chevron-left-Dj5JBZCL.js";import{C as J}from"./chevron-right-CCzTzBg_.js";const Q="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAABLCAYAAADH7F8IAAAAAXNSR0IArs4c6QAAAnhJREFUeF7tnLGO00AQhr/x+qpDgpICagqEREVDkxrRU9EgKJAoQCdEhTgkCgSUIF4AiQcAREFx4gGAnp6KCi6H4Ozd4RJxF8dKdImzXLzxrJQiideef/6Z2X/tSYTaUNWsgAsucBE4Vv9+ld5LFUxZ6mUVHgucXSWQ07AcgPdeNxSeAmMOWWUnDIGWpV5CeLfKQCdhG4L3Qb+ocr5z4AvVngS2asB3NfA8z3lbFOyk5pTMcR24UbU7wE08nw8+WwMpvN4VeFI9UOCFc3IrNdD79nqvDxQ2q/a7jJ6IfBzDOelAlKt5Lq86CV7gvnPyqJPgge8u4xrwQUT+pOaExcJ+hHZ3sBKmBh5Y+/eqmv4bCIfnfIJom5gsEwtekzMlOMfA19fESSQqfM0EnyDB+yafVh3fpc7MvMs4LiI/UwVflrqF0GtU8FzGCRH5YeAT9IAxb2E/Ctt5Cp7lfILpPjTZct5y3nJ+6AEreLNoe1N4Jm/TXOyiL3Vlqe/Jxm8NtcI1gdf1u8/xwXvdKxftG3uPoTadk4dVywx8TJFTGvMdDft+X0+ur9PGvN8Rkf5/zfn2cT7dougFz8An4oHozHc6522pa2HYm8IzeTsKy+gFr9O7uham+1STojNv4BPxgDEfcz/vvd4LHN2uLoNt5+Rlk2CLzvwSFN633MkpAz+nB4z5mDnf7bBXvXKUzWnO8UtE3swZ8fZ8PnrON2FgWXMMfMyCtywWm1zXmDfmrSfHenKsIckakg5ZP6wby7qxmkiM5c8xkWMix0SOiRwTObOIHIE7Hga/RE5yOLitcKZq/OBvIzYEniWJaEGjRVXP+cCnBc+T4nT5C+VNK6T5sEBjAAAAAElFTkSuQmCC",A="/assets/mine-mod-bankcard-CLOhqwHj_1791073035464-CLOhqwHj.png";function ee(){const{user:i,refreshUser:N}=O(),{toast:d}=T(),C=D(),[s,v]=p.useState(""),[o,w]=p.useState(null),[,I]=P(),y=(i?B(i.country):null)?.currency||"XOF",l=y==="FCFA"?"XOF":y,{data:c}=m({queryKey:["/api/settings/withdrawal"]}),f=c?.minWithdrawal??1500,x=c?.withdrawalFees??18,g=c?.withdrawalStartHour??9,u=c?.withdrawalEndHour??17,E=c?.maxWithdrawalsPerDay??2,L=s?Math.round(Number(s)*(1-x/100)):0,k=new Date().getHours(),F=k>=g&&k<u,{data:r=[],isLoading:S}=m({queryKey:["/api/wallets"]}),{data:W=[]}=m({queryKey:["/api/user/products"]}),M=W.some(t=>t.status==="active");p.useEffect(()=>{if(i?.country.trim().toUpperCase()==="BJ"){if(r.length===0)return;const a=localStorage.getItem("selectedWalletId");if(a){const n=r.find(h=>h.id===Number(a));if(localStorage.removeItem("selectedWalletId"),n){w(n);return}}w(n=>n&&r.some(h=>h.id===n.id)?n:r.find(h=>h.isDefault)??null);return}const t=localStorage.getItem("selectedWalletId");if(t&&r.length>0){const a=r.find(n=>n.id===parseInt(t));a&&w(a),localStorage.removeItem("selectedWalletId")}},[r,i?.country]),p.useEffect(()=>{if(i?.country.trim().toUpperCase()!=="BJ"&&!o&&r.length>0){const t=r.find(a=>a.isDefault);t&&w(t)}},[r,o,i?.country]);const b=V({mutationFn:async t=>(await U("POST","/api/withdrawals",t)).json(),onSuccess:()=>{d({title:"Demande envoyée",description:"Votre demande de retrait a été envoyée."}),N(),C.invalidateQueries({queryKey:["/api/withdrawals"]}),v("")},onError:t=>d({title:"Erreur",description:t.message,variant:"destructive"})}),R=()=>{if(!F){d({title:"Horaires de retrait",description:`Les retraits sont disponibles de ${g}h à ${u}h`,variant:"destructive"});return}if(!M){d({title:"Produit requis",description:"Vous devez avoir un produit actif pour effectuer un retrait",variant:"destructive"});return}if(!s||s<f){d({title:"Montant invalide",description:`Le montant minimum est de ${f} ${l}`,variant:"destructive"});return}if(!o){d({title:"Compte requis",description:"Veuillez sélectionner un compte bancaire",variant:"destructive"});return}b.mutate({amount:Number(s),walletId:o.id})};if(S)return e.jsx("div",{className:"min-h-screen bg-white flex items-center justify-center",children:e.jsx(j,{className:"w-8 h-8 animate-spin text-[#00CC2C]"})});if(!i)return null;const q=parseFloat(i?.balance||"0"),H=r.length>0;return e.jsxs("main",{className:"withdraw-reference",children:[e.jsx("style",{children:`
        .withdraw-reference {
          color: #151515;
          font-family: Inter, Arial, sans-serif;
        }
        .withdraw-reference .withdraw-screen {
          width: 100%;
          max-width: 500px;
          min-height: 100vh;
          margin: 0 auto;
          overflow: hidden;
          background: #f7f4f2;
        }
        .withdraw-reference .withdraw-hero {
          position: relative;
          height: min(70.7vw, 354px);
          min-height: 283px;
          background: #ffca2b;
        }
        .withdraw-reference .history-button {
          position: absolute;
          z-index: 3;
          top: 14px;
          right: 16px;
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border: 0;
          border-radius: 12px;
          background: rgba(255,255,255,.24);
        }
        .withdraw-reference .history-icon {
          position: relative;
          width: 30px;
          height: 30px;
          border: 2px solid #367c2b;
          border-radius: 4px;
          background: transparent;
        }
        .withdraw-reference .history-icon::before {
          position: absolute;
          top: 6px;
          left: 5px;
          width: 16px;
          height: 2px;
          content: "";
          background: #367c2b;
          box-shadow: 0 6px 0 #367c2b;
        }
        .withdraw-reference .history-icon::after {
          position: absolute;
          right: -7px;
          bottom: -7px;
          width: 11px;
          height: 11px;
          border: 2px solid #367c2b;
          border-radius: 50%;
          content: "";
          background: #ffde00;
        }
        .withdraw-reference .hero-art {
          position: relative;
          width: 100%;
          height: min(36.65vw, 183px);
          overflow: hidden;
        }
        .withdraw-reference .hero-art::before,
        .withdraw-reference .hero-art::after {
          position: absolute;
          content: "";
          border-radius: 42% 58% 52% 48%;
          background: #fdb900;
          transform: rotate(-12deg);
        }
        .withdraw-reference .hero-art::before {
          top: -24px;
          left: -25px;
          width: 168px;
          height: 128px;
          box-shadow:
            84px 23px 0 -20px #fdb900,
            330px 18px 0 5px rgba(255,255,255,.14);
        }
        .withdraw-reference .hero-art::after {
          top: 33px;
          right: 58px;
          width: 121px;
          height: 92px;
          background: rgba(255,255,255,.16);
          transform: rotate(18deg);
        }
        .withdraw-reference .hero-pattern {
          position: absolute;
          top: 10px;
          right: -24px;
          width: 205px;
          height: 145px;
          border-radius: 50%;
          background: rgba(255,255,255,.12);
          transform: rotate(-18deg);
        }
        .withdraw-reference .withdraw-title {
          position: absolute;
          z-index: 2;
          top: 82px;
          right: 0;
          left: 0;
          margin: 0;
          color: #111;
          font-size: 28px;
          font-weight: 500;
          line-height: 1;
          text-align: center;
        }
        .withdraw-reference .receipt-icon {
          position: absolute;
          z-index: 2;
          top: 15px;
          right: 25px;
          width: 25px;
          height: 31px;
          border: 3px solid #40b9cf;
          border-radius: 4px;
          transform: rotate(2deg);
        }
        .withdraw-reference .receipt-icon::before,
        .withdraw-reference .receipt-icon::after {
          position: absolute;
          left: 5px;
          content: "";
          width: 10px;
          height: 3px;
          border-radius: 3px;
          background: #367c2b;
        }
        .withdraw-reference .receipt-icon::before {
          top: 8px;
          box-shadow: 0 7px 0 #367c2b;
        }
        .withdraw-reference .receipt-icon::after {
          top: 20px;
          left: 12px;
          width: 6px;
          height: 6px;
          border: 2px solid #367c2b;
          border-radius: 50%;
          background: transparent;
        }
        .withdraw-reference .withdraw-back {
          position: absolute;
          z-index: 3;
          top: 85px;
          left: 24px;
          width: 40px;
          height: 40px;
          border: 0;
          background: transparent;
        }
        .withdraw-reference .withdraw-back::before {
          position: absolute;
          top: 14px;
          left: 9px;
          width: 14px;
          height: 14px;
          border-bottom: 3px solid #111;
          border-left: 3px solid #111;
          content: "";
          transform: rotate(45deg);
        }
        .withdraw-reference .balance-card {
          position: absolute;
          top: min(36.45vw, 182px);
          right: 16px;
          left: 16px;
          height: 160px;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,.88);
          border-radius: 10px;
          background: linear-gradient(110deg, #ffde00 0%, #fff6bf 100%);
          box-shadow: 0 1px 2px rgba(202,151,0,.1);
        }
        .withdraw-reference .balance-label {
          margin: 29px 0 0 15px;
          color: #25591c;
          font-size: 23px;
          font-weight: 800;
          line-height: 1;
        }
        .withdraw-reference .balance-value {
          margin: 20px 0 0 15px;
          color: #25591c;
          font-size: 43px;
          font-weight: 800;
          line-height: .9;
        }
        .withdraw-reference .balance-value span {
          margin-left: 3px;
          font-size: 28px;
        }
        .withdraw-reference .wallet-mark {
          position: absolute;
          top: 14px;
          right: 14px;
          display: grid;
          width: 109px;
          height: 109px;
          place-items: center;
          border-radius: 50%;
          background: white;
        }
        .withdraw-reference .wallet-mark img {
          width: 67px;
          height: 67px;
          object-fit: contain;
        }
        .withdraw-reference .amount-panel {
          min-height: 154px;
          padding: 25px 35px 16px;
          background: white;
        }
        .withdraw-reference .amount-label {
          margin: 0 0 7px 9px;
          color: #c98e41;
          font-size: 16px;
          font-weight: 400;
        }
        .withdraw-reference .amount-field {
          display: flex;
          height: 54px;
          align-items: center;
          overflow: hidden;
          border-radius: 12px;
          background: #f3f0ee;
        }
        .withdraw-reference .amount-field input {
          width: 100%;
          min-width: 0;
          height: 100%;
          padding: 0 21px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #656565;
          font-size: 19px;
        }
        .withdraw-reference .amount-field input::placeholder { color: #777; opacity: 1; }
        .withdraw-reference .amount-currency {
          padding-right: 20px;
          color: #767676;
          font-size: 24px;
        }
        .withdraw-reference .amount-details {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          color: #191919;
          font-size: 14px;
        }
        .withdraw-reference .wallet-choice {
          display: flex;
          width: calc(100% - 32px);
          height: 53px;
          align-items: center;
          margin: 12px 16px 0;
          padding: 0 17px;
          border-radius: 5px;
          background: linear-gradient(112deg, #367c2b 0%, #25591c 100%);
          color: white;
          text-align: left;
          box-shadow: 0 1px 2px rgba(214,153,0,.15);
        }
        .withdraw-reference .wallet-choice img {
          width: 34px;
          height: 34px;
          margin-right: 10px;
          object-fit: contain;
        }
        .withdraw-reference .wallet-choice svg:last-child {
          width: 22px;
          height: 22px;
          margin-left: auto;
        }
        .withdraw-reference .wallet-copy {
          overflow: hidden;
          font-size: 16px;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-reference .instructions {
          padding: 28px 9px 20px;
        }
        .withdraw-reference .instructions-title {
          margin-bottom: 29px;
          font-size: 17px;
          font-weight: 800;
        }
        .withdraw-reference .instructions-title::before {
          content: "💸";
          margin-right: 8px;
          font-size: 17px;
        }
        .withdraw-reference .instruction {
          position: relative;
          margin: 0 0 26px 28px;
          font-size: 17px;
          font-weight: 500;
          line-height: 1.65;
        }
        .withdraw-reference .instruction::before {
          content: "◆";
          position: absolute;
          top: 2px;
          left: -19px;
          color: #367c2b;
          font-size: 9px;
        }
        .withdraw-reference .instruction strong { font-weight: 800; }
        .withdraw-reference .submit {
          display: flex;
          width: calc(100% - 48px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 4px 24px 35px;
          border-radius: 29px;
          background: linear-gradient(112deg, #367c2b 0%, #25591c 100%);
          color: white;
          font-size: 17px;
          font-weight: 600;
        }
        .withdraw-reference .submit:disabled { opacity: .6; }
        @media (max-width: 360px) {
          .withdraw-reference .balance-card { right: 10px; left: 10px; }
          .withdraw-reference .wallet-mark { transform: scale(.82); transform-origin: top right; }
          .withdraw-reference .balance-label { font-size: 20px; }
          .withdraw-reference .balance-value { font-size: 37px; }
          .withdraw-reference .amount-panel { padding-right: 25px; padding-left: 25px; }
          .withdraw-reference .instruction { font-size: 15px; }
        }

        /* Light RoboticsFund layout matching the supplied withdrawal reference. */
        .withdraw-reference {
          --withdrawal-green: var(--jd-green, #367c2b);
          --withdrawal-green-dark: var(--jd-green-dark, #25591c);
          --withdrawal-yellow: var(--jd-yellow, #ffde00);
          --withdrawal-yellow-soft: var(--jd-yellow-soft, #fff6bf);
          min-height: 100dvh;
          background: #edf4e6;
          color: #20251f;
        }
        .withdraw-reference .withdraw-screen {
          width: min(100%, 500px);
          min-height: 100dvh;
          padding-bottom: 20px;
          background: #edf4e6;
        }
        .withdraw-reference .withdraw-hero {
          display: grid;
          height: 72px;
          min-height: 72px;
          place-items: center;
          border-bottom: 3px solid var(--withdrawal-green);
          background: var(--withdrawal-yellow);
        }
        .withdraw-reference .hero-art { display: none; }
        .withdraw-reference .withdraw-title {
          position: static;
          color: #1f2d1b;
          font-size: 23px;
          font-weight: 700;
          line-height: 1.1;
        }
        .withdraw-reference .history-button,
        .withdraw-reference .withdraw-back {
          top: 50%;
          display: grid;
          width: 44px;
          height: 44px;
          min-width: 44px;
          max-width: 44px;
          place-items: center;
          transform: translateY(-50%);
          border: 0;
          border-radius: 13px;
          background: var(--withdrawal-green);
          box-shadow: 0 2px 5px rgba(31, 65, 24, .2);
          color: #fff;
          text-decoration: none;
        }
        .withdraw-reference .history-button {
          right: 14px;
        }
        .withdraw-reference .history-button:hover,
        .withdraw-reference .withdraw-back:hover {
          opacity: .92;
          transform: translateY(-50%);
        }
        .withdraw-reference .history-button:focus-visible,
        .withdraw-reference .withdraw-back:focus-visible,
        .withdraw-reference .wallet-choice:focus-visible,
        .withdraw-reference .submit:focus-visible {
          outline: 3px solid #f4b33d;
          outline-offset: 3px;
        }
        .withdraw-reference .history-button img {
          display: block;
          width: 24px;
          height: 29px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .withdraw-reference .withdraw-back {
          left: 14px;
          color: #fff;
        }
        .withdraw-reference .withdraw-back::before {
          display: none;
        }
        .withdraw-reference .withdraw-back svg {
          width: 25px;
          height: 25px;
          stroke-width: 2.8;
        }
        .withdraw-reference .balance-card {
          position: relative;
          top: auto;
          right: auto;
          left: auto;
          display: flex;
          min-height: 108px;
          height: auto;
          align-items: center;
          gap: 16px;
          margin: 12px 16px 0;
          padding: 16px 18px;
          border: 1px solid rgba(54, 124, 43, .16);
          border-radius: 14px;
          background: linear-gradient(110deg, var(--withdrawal-yellow) 0%, var(--withdrawal-yellow-soft) 100%);
          box-shadow: 0 3px 8px rgba(25, 70, 22, .1);
        }
        .withdraw-reference .wallet-mark {
          position: static;
          display: grid;
          width: 64px;
          height: 64px;
          flex: 0 0 64px;
          place-items: center;
          border-radius: 14px;
          background: #fff;
        }
        .withdraw-reference .wallet-mark img {
          width: 46px;
          height: 44px;
          object-fit: contain;
          filter: brightness(0) saturate(100%) invert(30%) sepia(25%) saturate(1071%) hue-rotate(65deg) brightness(94%) contrast(91%);
        }
        .withdraw-reference .balance-label {
          margin: 0;
          color: #486643;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.2;
        }
        .withdraw-reference .balance-value {
          margin: 7px 0 0;
          color: var(--withdrawal-green-dark);
          font-size: clamp(29px, 8vw, 38px);
          font-weight: 800;
          letter-spacing: -.035em;
          line-height: 1;
          white-space: nowrap;
        }
        .withdraw-reference .wallet-panel {
          margin: 20px 20px 0;
        }
        .withdraw-reference .wallet-prompt {
          margin: 0 0 10px;
          color: #252c23;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.4;
        }
        .withdraw-reference .wallet-choice {
          width: 100%;
          min-height: 54px;
          height: auto;
          gap: 12px;
          margin: 0;
          padding: 8px 13px;
          border: 1.5px solid rgba(54, 124, 43, .58);
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(25, 70, 22, .08);
          color: #273326;
        }
        .withdraw-reference .wallet-choice img {
          width: 32px;
          height: 31px;
          flex: 0 0 32px;
          margin: 0;
          object-fit: contain;
          filter: brightness(0) saturate(100%) invert(30%) sepia(25%) saturate(1071%) hue-rotate(65deg) brightness(94%) contrast(91%);
        }
        .withdraw-reference .wallet-choice svg:last-child {
          color: var(--withdrawal-green);
        }
        .withdraw-reference .wallet-copy {
          min-width: 0;
          font-size: 15px;
        }
        .withdraw-reference .amount-panel {
          min-height: 0;
          margin: 20px 20px 0;
          padding: 0;
          background: transparent;
        }
        .withdraw-reference .amount-label {
          margin: 0 0 8px;
          color: #252c23;
          font-size: 18px;
          font-weight: 700;
        }
        .withdraw-reference .amount-field {
          height: 58px;
          gap: 14px;
          padding: 0 14px;
          border: 1px solid rgba(54, 124, 43, .24);
          border-bottom: 2px solid var(--withdrawal-green);
          border-radius: 10px 10px 3px 3px;
          background: #fff;
        }
        .withdraw-reference .amount-field input {
          order: 2;
          flex: 1;
          padding: 0;
          color: #252c23;
          font-size: 17px;
        }
        .withdraw-reference .amount-field input::placeholder {
          color: #7a8078;
        }
        .withdraw-reference .amount-currency {
          order: 1;
          flex: 0 0 auto;
          padding: 0;
          color: var(--withdrawal-green);
          font-size: 25px;
          font-weight: 700;
        }
        .withdraw-reference .amount-details {
          flex-wrap: wrap;
          gap: 5px 14px;
          margin-top: 8px;
          color: #606a5d;
          font-size: 12px;
        }
        .withdraw-reference .submit {
          width: calc(100% - 56px);
          min-height: 56px;
          margin: 22px 28px 0;
          border-radius: 13px;
          background: linear-gradient(112deg, var(--withdrawal-green) 0%, var(--withdrawal-green-dark) 100%);
          box-shadow: 0 3px 8px rgba(25, 70, 22, .18);
          color: #fff;
          font-size: 19px;
          font-weight: 700;
        }
        .withdraw-reference .submit:hover:not(:disabled) {
          background: var(--withdrawal-green-dark);
        }
        .withdraw-reference .instructions {
          padding: 22px 20px 4px;
        }
        .withdraw-reference .instructions-title {
          margin: 0 0 12px;
          color: var(--withdrawal-green-dark);
          font-size: 16px;
          font-weight: 700;
        }
        .withdraw-reference .instructions-title::before {
          display: none;
        }
        .withdraw-reference .instructions-list {
          display: grid;
          gap: 9px;
          margin: 0;
          padding-left: 22px;
          color: #3f493c;
        }
        .withdraw-reference .instructions-list li {
          padding-left: 3px;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.5;
        }
        .withdraw-reference .instructions-list li::marker {
          color: var(--withdrawal-green);
          font-weight: 700;
        }
        @media (max-width: 360px) {
          .withdraw-reference .balance-card {
            margin-right: 10px;
            margin-left: 10px;
            padding-right: 12px;
            padding-left: 12px;
          }
          .withdraw-reference .wallet-mark {
            transform: none;
          }
          .withdraw-reference .wallet-panel,
          .withdraw-reference .amount-panel,
          .withdraw-reference .instructions {
            margin-right: 14px;
            margin-left: 14px;
          }
        }
      `}),e.jsxs("div",{className:"withdraw-screen",children:[e.jsxs("section",{className:"withdraw-hero","aria-label":"Retrait",children:[e.jsx("h1",{className:"withdraw-title",children:"Retrait"}),e.jsx(z,{href:"/history",className:"history-button","aria-label":"Historique des transactions",children:e.jsx("img",{src:Q,alt:""})}),e.jsx(z,{href:"/account",className:"withdraw-back","data-testid":"button-back","aria-label":"Retour",children:e.jsx(K,{"aria-hidden":"true"})})]}),e.jsxs("div",{className:"balance-card",children:[e.jsx("div",{className:"wallet-mark","aria-hidden":"true",children:e.jsx("img",{src:A,alt:""})}),e.jsxs("div",{className:"balance-copy",children:[e.jsx("p",{className:"balance-label",children:"Solde"}),e.jsxs("p",{className:"balance-value","data-testid":"text-balance",children:[l," ",Math.round(q).toLocaleString("fr-FR")]})]})]}),e.jsxs("section",{className:"wallet-panel","aria-label":"Portefeuille de retrait",children:[e.jsx("p",{className:"wallet-prompt",children:"Veuillez sélectionner votre carte bancaire"}),e.jsxs("button",{type:"button",onClick:()=>I(H?"/wallet?from=withdrawal":"/wallet"),className:"wallet-choice","data-testid":"button-select-wallet",children:[e.jsx("img",{src:A,alt:""}),e.jsx("span",{className:"wallet-copy",children:o?`${o.accountName} · ${o.accountNumber}`:"Choisissez votre portefeuille"}),e.jsx(J,{"aria-hidden":"true"})]})]}),e.jsxs("section",{className:"amount-panel","aria-label":"Montant de retrait",children:[e.jsx("p",{className:"amount-label",children:"Montant"}),e.jsxs("label",{className:"amount-field",children:[e.jsx("span",{className:"amount-currency",children:l}),e.jsx("input",{type:"number",value:s,onChange:t=>v(t.target.value?Number(t.target.value):""),placeholder:"Entrez le montant du retrait","data-testid":"input-withdrawal-amount","aria-label":"Montant de retrait"})]}),e.jsxs("div",{className:"amount-details",children:[e.jsxs("span",{children:["Montant reçu : ",L.toLocaleString("fr-FR")," ",l]}),e.jsxs("span",{children:["Taux de frais : ",x,"%"]})]})]}),e.jsx("button",{type:"button",onClick:R,disabled:b.isPending,className:"submit","data-testid":"button-submit-withdrawal",children:b.isPending?e.jsx(j,{className:"h-5 w-5 animate-spin"}):"Confirmer"}),e.jsxs("section",{className:"instructions","aria-label":"Instructions de retrait",children:[e.jsx("h2",{className:"instructions-title",children:"Instructions de retrait"}),e.jsxs("ol",{className:"instructions-list",children:[e.jsxs("li",{children:["Montant minimum de retrait : ",f.toLocaleString("fr-FR")," ",l,"."]}),e.jsxs("li",{children:["Les frais de retrait s’élèvent à ",x,"% du montant retiré."]}),e.jsxs("li",{children:["Les retraits sont disponibles de ",g,"h à ",u,"h, dans la limite de ",E," par jour."]}),e.jsx("li",{children:"Délai de traitement : généralement sous 2 heures, et exceptionnellement sous 24 heures."})]})]})]})]})}export{ee as default};
