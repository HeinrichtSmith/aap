import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Presentation from '../pages/Presentation';

const PresentationWrapper = ({ children }) => {
  const [searchParams] = useSearchParams();
  const isPresentationMode = searchParams.get('mode') === 'present';

  if (isPresentationMode) {
    return <Presentation />;
  }

  return children;
};

export default PresentationWrapper;