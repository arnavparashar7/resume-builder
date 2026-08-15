import "./classic.css";
import type { ResumeTemplateProps } from "../types";
import type { EntryData, BulletData, EducationEntryData, ExtraLink } from "@/types/resume";
import { RichTextRenderer, RichTextInline } from "@/components/resume/RichTextRenderer";
import { isDocEmpty } from "@/lib/resume/richtext";
import { displayDateRange, displayEducationDate, visibleSections } from "@/lib/resume/present";

/**
 * Classic template - a close recreation of the reference resume
 * (ResumeOLD.pdf): centered serif name + rule, gray section header bars, a
 * bordered education table, and bulleted entries with right-aligned dates
 * and one level of nested sub-bullets.
 *
 * This component is the ONLY thing that knows what "Classic" looks like.
 * It renders purely from `data: ResumeData` - see templates/types.ts for why
 * that's the whole contract, and how it's what lets the exact same component
 * back both the live preview and (Checkpoint 5) the PDF export.
 */
export default function ClassicTemplate({ data }: ResumeTemplateProps) {
  const { personalInfo } = data;

  return (
    <div className="classic-page">
      <h1 className="classic-name">{personalInfo.name || "Your Name"}</h1>
      <hr className="classic-rule" />
      <ContactLine email={personalInfo.email} phone={personalInfo.phone} linkedin={personalInfo.linkedin} website={personalInfo.website} extraLinks={personalInfo.extraLinks} />

      {visibleSections(data.sections).map((section) => (
        <div key={section.id} className="classic-section">
          <div className="classic-section-header">{section.title}</div>

          {section.type === "EDUCATION" && <EducationTable entries={section.educationEntries ?? []} />}
          {section.type === "ENTRIES" && <EntriesList entries={section.entries ?? []} />}
          {section.type === "RICHTEXT" && (
            <div className="classic-richtext">
              <RichTextRenderer doc={section.richContent} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Header contact line: only non-empty fields are shown, joined with " | ".
// ----------------------------------------------------------------------------
function ContactLine({
  email,
  phone,
  linkedin,
  website,
  extraLinks,
}: {
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  extraLinks: ExtraLink[];
}) {
  const parts: React.ReactNode[] = [];
  if (email) parts.push(<a key="email" href={`mailto:${email}`}>{email}</a>);
  if (phone) parts.push(<span key="phone">{phone}</span>);
  if (linkedin) parts.push(<a key="linkedin" href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>);
  if (website) parts.push(<a key="website" href={website} target="_blank" rel="noopener noreferrer">Portfolio</a>);
  extraLinks.forEach((link, i) => {
    if (link.url) parts.push(<a key={`extra-${i}`} href={link.url} target="_blank" rel="noopener noreferrer">{link.label || link.url}</a>);
  });

  if (parts.length === 0) return null;

  return (
    <p className="classic-contact">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " | "}
          {part}
        </span>
      ))}
    </p>
  );
}

// ----------------------------------------------------------------------------
// Education: bordered 4-column table (Degree/Field, Date, Institution, Grade)
// ----------------------------------------------------------------------------
function EducationTable({ entries }: { entries: EducationEntryData[] }) {
  if (entries.length === 0) return null;
  return (
    <table className="classic-edu-table">
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{entry.field ? `${entry.degree} - ${entry.field}` : entry.degree}</td>
            <td>{displayEducationDate(entry)}</td>
            <td>{entry.institution}</td>
            <td>{entry.grade}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ----------------------------------------------------------------------------
// Entries (Experience, Projects, Positions of Responsibility, etc.)
// ----------------------------------------------------------------------------
// An entry with a title or date renders as its own bulleted line (bold title
// + right-aligned date), with its bullets nested one level in. An entry with
// NEITHER (used for plain bullet-only sections like "Academic Achievements
// and Awards" in the reference resume) renders its bullets directly at the
// top level instead of wrapping them in an empty header line.
// ----------------------------------------------------------------------------
function EntriesList({ entries }: { entries: EntryData[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="classic-entries">
      {entries.map((entry) => {
        const dateStr = displayDateRange(entry);
        const hasHeader = entry.title.trim().length > 0 || dateStr.length > 0;

        if (!hasHeader) {
          return entry.bullets.map((bullet) => <BulletItem key={bullet.id} bullet={bullet} />);
        }

        return (
          <li key={entry.id}>
            <div className="classic-entry-header">
              <span>
                {entry.title && <strong>{entry.title}</strong>}
                {entry.subtitle && ` ${entry.subtitle}`}
                {entry.location && ` - ${entry.location}`}
              </span>
              {dateStr && <span className="classic-entry-date">{dateStr}</span>}
            </div>
            {!isDocEmpty(entry.description) && (
              <div className="classic-entry-description">
                <RichTextRenderer doc={entry.description} />
              </div>
            )}
            {entry.bullets.length > 0 && (
              <ul>
                {entry.bullets.map((bullet) => (
                  <BulletItem key={bullet.id} bullet={bullet} />
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BulletItem({ bullet }: { bullet: BulletData }) {
  return (
    <li>
      <RichTextInline doc={bullet.content} />
      {bullet.children.length > 0 && (
        <ul>
          {bullet.children.map((child) => (
            <BulletItem key={child.id} bullet={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
