import styles from '../../styles/Home.module.css';
import profileStyles from '../../styles/Profile.module.css';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ProfileContent from '../../components/ProfileContent';

export default function ProfilePage() {
  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.main}>
          <ProfileContent />
        </main>
      </div>
    </div>
  );
}
