import React from 'react';
import { Image, Text } from 'react-native';
import { gamePictures } from '../../assets/game-pictures';
import { pictureNameByValue } from '../../types';

interface GamePictureProps {
  name: string;
  size: number;
  label?: string;
}

/** Set a label for a standalone picture. In a labelled control the art is decorative. */
export function GamePicture({ name, size, label }: GamePictureProps) {
  const source = gamePictures[name] ?? gamePictures[pictureNameByValue.get(name) ?? ''];
  return source ? (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode='contain'
      fadeDuration={0}
      accessible={Boolean(label)}
      accessibilityLabel={label}
      aria-hidden={!label}
    />
  ) : (
    <Text
      allowFontScaling={false}
      style={{ fontSize: size }}
      accessible={Boolean(label)}
      accessibilityLabel={label}
      aria-hidden={!label}
    >
      ?
    </Text>
  );
}
