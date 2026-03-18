"use client";

import React from 'react';
import Modal from './Modal';
import {
  Calendar,
  Gamepad2,
  Library,
  List,
  Star,
  BarChart2,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: Gamepad2,
    title: 'Découvrir des jeux',
    desc: 'Explorez des milliers de jeux avec des filtres avancés. Recherchez par plateforme, genre, date de sortie et bien plus.',
  },
  {
    icon: Calendar,
    title: 'Calendrier des sorties',
    desc: 'Ne manquez aucune sortie ! Restez informé grâce à notre calendrier interactif des jeux à venir.',
  },
  {
    icon: Library,
    title: 'Votre collection',
    desc: 'Suivez les jeux en cours, terminés ou à jouer. Organisez votre bibliothèque avec des statuts personnalisés.',
  },
  {
    icon: List,
    title: 'Listes personnalisées',
    desc: 'Créez des listes thématiques pour toutes les occasions. Partagez vos coups de cœur et pépites cachées.',
  },
  {
    icon: Star,
    title: 'Notes & critiques',
    desc: 'Partagez votre avis ! Notez les jeux et rédigez des critiques pour aider la communauté.',
  },
  {
    icon: BarChart2,
    title: 'Statistiques',
    desc: 'Visualisez vos habitudes gaming : genres préférés, plateformes, évolution de votre collection.',
  },
];

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bienvenue sur Avalanche"
      size="xl"
    >
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Avalanche est votre plateforme tout-en-un pour découvrir, suivre et célébrer
            votre parcours gaming. Que vous cherchiez votre prochaine aventure ou organisiez
            votre collection, nous sommes là pour vous.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
