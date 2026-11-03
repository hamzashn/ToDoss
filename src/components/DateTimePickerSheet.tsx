import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useOpenSession } from '@/hooks/useOpenSession';
import { colors, spacing } from '@/theme';

import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';

export type PickerMode = 'date' | 'time';

export type PickerRequest = {
  mode: PickerMode;
  value: Date;
  title: string;
  onPick: (date: Date) => void;
};

/**
 * Android'de sistem diyaloğunu açar ve true döner. iOS'ta false döner;
 * çağıran taraf isteği <DateTimePickerSheet> ile gösterir.
 */
export function openNativePicker(request: PickerRequest): boolean {
  if (Platform.OS !== 'android') return false;
  DateTimePickerAndroid.open({
    mode: request.mode,
    value: request.value,
    is24Hour: true,
    firstDayOfWeek: 1,
    onValueChange: (_, date) => request.onPick(date),
  });
  return true;
}

type Props = { visible: boolean; request: PickerRequest | null; onClose: () => void };

/** iOS için alt sayfa içinde tarih/saat seçici. `request` kapanış animasyonu boyunca korunur. */
export function DateTimePickerSheet({ visible, request, onClose }: Props) {
  const { session } = useOpenSession(visible, null);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={request?.title}>
      {request ? <PickerBody key={session} request={request} onClose={onClose} /> : null}
    </BottomSheet>
  );
}

function PickerBody({ request, onClose }: { request: PickerRequest; onClose: () => void }) {
  const [value, setValue] = useState(request.value);

  return (
    <View style={styles.body}>
      <RNDateTimePicker
        mode={request.mode}
        value={value}
        display={request.mode === 'date' ? 'inline' : 'spinner'}
        locale="tr-TR"
        is24Hour
        themeVariant="light"
        accentColor={colors.primary}
        textColor={colors.text}
        minuteInterval={5}
        onValueChange={(_, date) => setValue(date)}
        style={styles.picker}
      />
      <Button
        title="Tamam"
        onPress={() => {
          request.onPick(value);
          onClose();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  picker: { alignSelf: 'stretch' },
});
