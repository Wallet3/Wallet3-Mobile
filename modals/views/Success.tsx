import React, { useEffect, useRef } from 'react';

import LottieView from 'lottie-react-native';
import { View } from 'react-native';

export default () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <LottieView
        autoPlay
        loop={false}
        source={require('../../assets/animations/check-verde.json')}
        style={{
          width: 290,
          height: 290,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    </View>
  );
};
