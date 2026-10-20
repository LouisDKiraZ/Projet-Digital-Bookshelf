import type { ShelfMember } from '../../types/shelf';
import styles from './PeopleTab.module.css';

interface PeopleTabProps {
  members: ShelfMember[];
}

// Inviting and removing people is deliberately out of scope for this
// pass — there's no join flow yet to invite someone into (see CLAUDE.md
// "Known gaps"). This just lists who's already on the shelf.
export function PeopleTab({ members }: PeopleTabProps) {
  return (
    <div className={styles.tab}>
      <ul className={styles.list}>
        {members.map((member) => (
          <li key={member.id} className={styles.member}>
            {member.displayName}
          </li>
        ))}
      </ul>
      <p className={styles.hint}>Inviting and removing people from this shelf is coming soon.</p>
    </div>
  );
}
