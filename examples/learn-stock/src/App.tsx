import { useState } from 'react';
import { course } from './data/course';
import { AnnotatedMessage } from './components/AnnotatedMessage';
import { useProgressStore } from './stores/progressStore';

export function App() {
  const orderedIds = course.lessons.map((l) => l.id);
  const [activeId, setActiveId] = useState(course.lessons[0]?.id ?? 1);
  const getStatus = useProgressStore((s) => s.getStatus);
  const markCompleted = useProgressStore((s) => s.markCompleted);

  const active = course.lessons.find((l) => l.id === activeId);

  return (
    <div className="la-app">
      <aside className="la-sidebar">
        <h1>{course.topic}</h1>
        <p className="la-desc">{course.description}</p>
        <ol className="la-lessons">
          {course.lessons.map((l) => {
            const status = getStatus(l.id, orderedIds);
            return (
              <li key={l.id}>
                <button
                  className={`la-lesson la-${status}`}
                  disabled={status === 'locked'}
                  onClick={() => setActiveId(l.id)}
                >
                  <span className="la-lesson-title">{l.title}</span>
                  <span className="la-lesson-status">{status}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="la-main">
        {active && (
          <>
            <h2>{active.title}</h2>
            <p className="la-summary">{active.summary}</p>

            {/* Demo: the select-to-ask interaction over the lesson summary.
                Replace with the live tutor chat in Phase 3. Try highlighting
                any phrase below. */}
            <AnnotatedMessage
              messageId={`lesson-${active.id}-intro`}
              lessonId={active.id}
              content={
                `## ${active.title}\n\n${active.summary}\n\n` +
                active.keyPoints
                  .map((k) => `- **${k.title}** — ${k.desc}`)
                  .join('\n')
              }
            />

            <button
              className="la-complete"
              onClick={() => markCompleted(active.id)}
            >
              Mark lesson complete
            </button>
          </>
        )}
      </main>
    </div>
  );
}
