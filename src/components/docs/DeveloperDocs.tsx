import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, EmptyState } from "@app/ui";
import { DocsNav } from "@app/components/docs/DocsNav";
import { DocsSection } from "@app/components/docs/DocsSection";
import { DocsToc } from "@app/components/docs/DocsToc";
import { MarkdownDoc } from "@app/components/docs/MarkdownDoc";
import { extractHeadings } from "@app/docs/headings";
import { firstDocId, loadDoc, loadDocsNav } from "@app/docs/manifest/registry";
import "@app/components/docs/DeveloperDocs.css";

/**
 * Developer Docs — a markdown browser over Fold's documentation manifest.
 * The nav is auto-sorted from sections and items; content is rich markdown.
 * Full-text search across docs lives in the global super search (Cmd/Ctrl+K).
 */
export function DeveloperDocs() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLElement>(null);
  const [navOpen, setNavOpen] = useState(false);

  const nav = useMemo(() => loadDocsNav(), []);
  const fallback = useMemo(() => firstDocId(), []);

  // Deep-link support: the active doc id lives in the URL hash.
  const hashId = decodeURIComponent(hash.replace(/^#/, ""));
  const activeId = hashId && loadDoc(hashId) ? hashId : fallback;
  const doc = activeId ? loadDoc(activeId) : undefined;
  const section = useMemo(
    () => nav.find((s) => s.items.some((i) => i.id === activeId)),
    [nav, activeId],
  );
  // "On this page" headings for the current doc.
  const headings = useMemo(
    () => (doc ? extractHeadings(doc.markdown) : []),
    [doc],
  );

  // Navigating closes the mobile drawer and resets the pane.
  const onSelect = useCallback(
    (id: string) => {
      navigate({ hash: id });
      setNavOpen(false);
    },
    [navigate],
  );

  useEffect(() => {
    contentRef.current?.scrollTo?.({ top: 0 });
  }, [activeId]);

  if (nav.length === 0 || !doc) {
    return (
      <div className="portal-docs portal-docs--empty">
        <EmptyState
          title={t("portal.docs.nav.empty.title")}
          description={t("portal.docs.nav.empty.description")}
        />
      </div>
    );
  }

  const hasToc = headings.length > 0;

  return (
    <div className={"portal-docs" + (hasToc ? " portal-docs--with-toc" : "")}>
      <div className="portal-docs__mobile-bar">
        <button
          type="button"
          className="portal-docs__mobile-back"
          aria-label={t("common.back", "Back")}
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
        >
          <svg
            className="portal-docs__back-svg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>{t("common.back", "Back")}</span>
        </button>

        <a
          href="/"
          className="portal-docs__mobile-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          aria-label="Fold Home"
        >
          <svg className="portal-docs__mobile-logo" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z"
            />
          </svg>
          <span className="portal-docs__mobile-brand-name">Docs</span>
        </a>

        <Button
          variant="tertiary"
          className="portal-docs__nav-toggle"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
          leftSection={<span aria-hidden>☰</span>}
        >
          {t("portal.docs.browse")}
        </Button>
      </div>


      {/* Layout column, not a landmark: the <nav> inside already carries its
          own named landmark, and an unlabelled complementary region would be
          indistinguishable to assistive tech. */}
      <div className={"portal-docs__sidebar" + (navOpen ? " is-open" : "")}>
        <DocsNav sections={nav} active={activeId ?? ""} onSelect={onSelect} />
      </div>

      <main className="portal-docs__content" ref={contentRef}>
        <div className="portal-docs__content-inner">
          <DocsSection
            id={doc.id}
            eyebrow={section?.label ?? ""}
            title={doc.title}
            lead={doc.description}
          >
            <MarkdownDoc markdown={doc.markdown} onNavigate={onSelect} />
            <div className="portal-docs__source">
              <a href={doc.editUrl} target="_blank" rel="noopener noreferrer">
                {t("portal.docs.viewSource")}
              </a>
            </div>
          </DocsSection>
        </div>
      </main>

      {hasToc && (
        <div className="portal-docs__toc-col">
          <DocsToc headings={headings} scrollRef={contentRef} />
        </div>
      )}
    </div>
  );
}
