import styles from '../styles/Sidebar.module.css';

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
      <h3>Categories</h3>
      <div className={styles.categories}>
        {categories.map((category) => (
          <div key={category.name} className={styles.category}>
            <span className={styles.categoryName}>{category.name}</span>
            <span className={styles.categoryCount}>{category.count}</span>
          </div>
        ))}
      </div>
      <button className={styles.viewAllBtn}>All Categories</button>
      
      <div className={styles.completedBox}>
        <h3>Completed</h3>
        <p>Track your finished games</p>
        <button>View All</button>
      </div>
      
      <div className={styles.collectionBox}>
        <h3>Create Collection</h3>
        <p>Organize your game library</p>
        <button>Create</button>
      </div>
    </aside>
  );
};

export default Sidebar;
