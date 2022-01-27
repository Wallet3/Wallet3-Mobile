import React, { useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { FontStyle } from 'react-native-svg';
import Image from 'react-native-expo-cached-image';
import { genColor } from '../utils/emoji';

interface Props {
  uri?: string;
  size?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  imageRadius?: number;
  containerStyle?: StyleProp<ViewStyle>;
  fontStyle?: StyleProp<ViewStyle>;
}

export default ({ uri, text, size, width, height, containerStyle, fontSize, fontStyle, imageRadius }: Props) => {
  const [iconFailed, setIconFailed] = useState(false);

  width = width ?? size;
  height = height ?? size;
  const borderRadius = imageRadius ?? (width || size || 0) / 2;

  return (
    <View style={{ position: 'relative', ...(containerStyle || ({} as any)) }}>
      <View
        style={{
          width,
          height,
          position: 'absolute',
          borderRadius,
          backgroundColor: genColor(),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize, fontWeight: '600', ...(fontStyle || ({} as any)) }}>{text?.[0]}</Text>
      </View>

      <Image
        source={{ uri }}
        onError={() => setIconFailed(true)}
        style={{
          width,
          height,
          borderRadius,
          backgroundColor: iconFailed ? undefined : '#fff',
        }}
      />
    </View>
  );
};
