import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import supportTelegramIcon from "@assets/groupService_1790964597734.png";
import serviceBanner from "@assets/banner_1791391450632.png";
import "./service-screenshot.css";

interface LinksSettings {
  supportLink?: string;
  supportEnabled?: string | boolean;
  support2Link?: string;
  support2Label?: string;
  support2Enabled?: string | boolean;
  channelLink?: string;
  channelLabel?: string;
  channelEnabled?: string | boolean;
  groupLink?: string;
  groupEnabled?: string | boolean;
}

function isEnabled(value?: string | boolean) {
  return value === true || value === "true";
}

function ServiceContact({
  title,
  action,
  href,
  testId,
}: {
  title: string;
  action: string;
  href: string;
  testId: string;
}) {
  return (
    <article className="service-contact-row">
      <img className="service-contact-icon" src={supportTelegramIcon} alt="" aria-hidden="true" />
      <div className="service-link-copy">
        <h2>{title}</h2>
        <a
          className="service-link-action"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={testId}
        >
          {action}
        </a>
      </div>
    </article>
  );
}

export default function ServicePage() {
  const [, navigate] = useLocation();
  const { data: settings } = useQuery<LinksSettings>({
    queryKey: ["/api/settings/links"],
  });
  const contacts = [
    {
      key: "support",
      title: "Service Telegram",
      action: "Durée de connexion : 10h-22h",
      href: settings?.supportLink || "https://t.me/sybotx",
      enabled: isEnabled(settings?.supportEnabled),
      testId: "button-support-link",
    },
    {
      key: "support2",
      title: settings?.support2Label || "Service client 2",
      action: "Contacter le service client",
      href: settings?.support2Link || "https://t.me/sybotx",
      enabled: isEnabled(settings?.support2Enabled),
      testId: "button-support2-link",
    },
    {
      key: "channel",
      title: settings?.channelLabel || "Chaîne officielle",
      action: "Rejoignez la chaîne officielle",
      href: settings?.channelLink || "https://t.me/sybotx",
      enabled: isEnabled(settings?.channelEnabled),
      testId: "button-channel-link",
    },
    {
      key: "group",
      title: "Groupe officiel",
      action: "Rejoignez le groupe Telegram",
      href: settings?.groupLink || "https://t.me/sybotx",
      enabled: isEnabled(settings?.groupEnabled),
      testId: "button-group-link",
    },
  ];

  return (
    <main className="service-client-page">
      <div className="service-client-screen">
        <h1 className="sr-only">Service client</h1>
        <button
          className="service-client-back"
          type="button"
          aria-label="Retour au compte"
          onClick={() => navigate("/account")}
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <img
          className="service-client-banner"
          src={serviceBanner}
          alt="Contact us, online service, professional customer service and team"
        />

        <section className="service-client-contacts" aria-label="Contacts officiels">
          {contacts.filter((contact) => contact.enabled).map((contact) => (
            <ServiceContact
              key={contact.key}
              title={contact.title}
              action={contact.action}
              href={contact.href}
              testId={contact.testId}
            />
          ))}
        </section>
      </div>
    </main>
  );
}