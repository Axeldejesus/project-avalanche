import styles from '../styles/Sidebar.module.css';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BadgeCheck, FolderPlus, ChevronRight } from 'lucide-react';

interface Category {
  name: string;
  count: number;
}

const Sidebar: React.FC = () => {
  const categories: Category[] = [
    { name: 'Action', count: 1234 },
    { name: 'RPG', count: 856 },
    { name: 'Sports', count: 543 },
    { name: 'Strategy', count: 432 },
    { name: 'Puzzle', count: 321 },
    { name: 'Horror', count: 298 },
    { name: 'Adventure', count: 654 },
    { name: 'Racing', count: 187 }
  ];
  
  return (
    <aside className={styles.sidebar}>
      
      <div className={styles.completedBox}>
        <h3>Completed</h3>
        <p>Track your finished games</p>
        <Button variant="secondary">
          <BadgeCheck className="mr-2" size={16} />
          View All
        </Button>
      </div>
      
      <div className={styles.collectionBox}>
        <h3>Create Collection</h3>
        <p>Organize your game library</p>
        <Button variant="default">
          <FolderPlus className="mr-2" size={16} />
          Create
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
