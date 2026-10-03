import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { AlertCircle, CheckCircle2, Info } from '@/components/Icon';

export type DialogType = 'success' | 'error' | 'info' | 'warning';

export interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  type: DialogType;
  buttons?: DialogButton[];
}

export const defaultDialogState: DialogState = {
  visible: false,
  title: '',
  message: '',
  type: 'info',
};

interface DialogModalProps {
  dialog: DialogState;
  setDialog: (dialog: DialogState) => void;
}

export function DialogModal({ dialog, setDialog }: DialogModalProps) {
  const close = () => {
    setDialog({ ...dialog, visible: false });
  };

  const handlePress = (onPress?: () => void) => {
    if (onPress) onPress();
    close();
  };

  return (
    <Modal
      visible={dialog.visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <AnimatePresence>
          {dialog.visible && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark.overlay }]}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {dialog.visible && (
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, translateY: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              style={styles.modalContent}
            >
              <View style={styles.iconContainer}>
                {dialog.type === 'success' && <CheckCircle2 size={48} color={Colors.dark.hex_34d399} />}
                {dialog.type === 'error' && <AlertCircle size={48} color={Colors.dark.error} />}
                {dialog.type === 'warning' && <AlertCircle size={48} color={Colors.dark.primary} />}
                {dialog.type === 'info' && <Info size={48} color={Colors.dark.primary} />}
              </View>
              
              <Text style={styles.title}>{dialog.title}</Text>
              <Text style={styles.message}>{dialog.message}</Text>
              
              <View style={styles.buttonContainer}>
                {dialog.buttons ? (
                  dialog.buttons.map((btn, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={[
                        styles.button, 
                        btn.style === 'cancel' ? styles.buttonCancel : 
                        btn.style === 'destructive' ? styles.buttonDestructive : 
                        styles.buttonPrimary,
                        dialog.buttons!.length > 2 && { width: '100%', marginBottom: 8 }
                      ]} 
                      onPress={() => handlePress(btn.onPress)}
                    >
                      <Text style={[
                        styles.buttonText, 
                        btn.style === 'cancel' ? styles.buttonTextCancel : 
                        btn.style === 'destructive' ? styles.buttonTextDestructive : 
                        styles.buttonTextPrimary
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={close}>
                    <Text style={styles.buttonTextPrimary}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    shadowColor: Colors.dark.background,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: Typography.serif,
    fontSize: 22,
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.dark.border,
  },
  buttonPrimary: {
    backgroundColor: Colors.dark.primary,
  },
  buttonDestructive: {
    backgroundColor: Colors.dark.error,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonTextCancel: {
    color: Colors.dark.text,
  },
  buttonTextPrimary: {
    color: Colors.dark.dark,
  },
  buttonTextDestructive: {
    color: '#FFF',
  },
});
