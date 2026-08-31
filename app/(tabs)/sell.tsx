import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { CategoryChip } from '../../src/components/CategoryChip';
import { useAuth } from '../../src/context/AuthContext';
import { useCategories } from '../../src/hooks/useCategories';
import { supabase } from '../../src/lib/supabase';
import { uploadListingImage } from '../../src/lib/uploadImage';
import { CURRENCIES, DEFAULT_CURRENCY } from '../../src/lib/currency';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { radius, spacing } from '../../src/theme/colors';
import type { Condition } from '../../src/types/database';

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'used', label: 'Used' },
  { value: 'fair', label: 'Fair' },
];

const MAX_IMAGES = 6;

export default function Sell() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { categories } = useCategories();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [condition, setCondition] = useState<Condition>('used');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
    header: { fontSize: 24, fontWeight: '800' as const, color: colors.text, marginBottom: spacing.lg },
    sectionLabel: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.xs },
    chipsWrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: spacing.md },
    chipsScroll: { marginBottom: spacing.md },
    chipsScrollContent: { paddingRight: spacing.lg },
    imageRow: { marginBottom: spacing.md },
    imageThumbWrap: { marginRight: spacing.sm },
    imageThumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surface },
    removeBadge: {
      position: 'absolute' as const,
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.black,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    addImage: {
      width: 84,
      height: 84,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    addImageText: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    textArea: { height: 100, paddingTop: spacing.sm, textAlignVertical: 'top' as const },
    submit: { marginTop: spacing.lg },
  }));

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add pictures to your listing.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (uri: string) => setImages((prev) => prev.filter((a) => a.uri !== uri));

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCurrency(DEFAULT_CURRENCY);
    setLocation('');
    setCategoryId(null);
    setCondition('used');
    setImages([]);
  };

  const canSubmit = !!(title.trim() && price.trim() && categoryId && !submitting);

  const onSubmit = async () => {
    if (!session) return;
    const priceValue = Number(price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Invalid price', 'Enter a valid price.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Choose a category', 'Pick a category for your listing.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          seller_id: session.user.id,
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          price: priceValue,
          currency,
          location: location.trim() || null,
          condition,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      if (images.length) {
        const uploaded = await Promise.all(
          images.map((asset) => uploadListingImage(session.user.id, asset.uri, asset.mimeType))
        );
        const rows = uploaded.map((url, index) => ({ listing_id: listing.id, url, position: index }));
        const { error: imagesError } = await supabase.from('listing_images').insert(rows);
        if (imagesError) throw imagesError;
      }

      resetForm();
      router.push(`/listing/${listing.id}`);
    } catch (err: any) {
      Alert.alert('Could not publish listing', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>Sell an item</Text>

          <Text style={styles.sectionLabel}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {images.map((asset) => (
              <View key={asset.uri} style={styles.imageThumbWrap}>
                <Image source={{ uri: asset.uri }} style={styles.imageThumb} />
                <Pressable style={styles.removeBadge} onPress={() => removeImage(asset.uri)}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
              <Pressable style={styles.addImage} onPress={pickImages}>
                <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
                <Text style={styles.addImageText}>Add photo</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Vintage denim jacket" />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe condition, size, brand..."
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          <Text style={styles.sectionLabel}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsScrollContent}>
            {CURRENCIES.map((c) => (
              <CategoryChip key={c.code} label={`${c.symbol} ${c.code}`} active={currency === c.code} onPress={() => setCurrency(c.code)} />
            ))}
          </ScrollView>

          <TextField
            label={`Price (${currency})`}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <TextField label="Location (optional)" value={location} onChangeText={setLocation} placeholder="e.g. Manchester" />

          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipsWrap}>
            {categories.map((c) => (
              <CategoryChip key={c.id} label={c.name} icon={c.icon as any} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Condition</Text>
          <View style={styles.chipsWrap}>
            {CONDITIONS.map((c) => (
              <CategoryChip key={c.value} label={c.label} active={condition === c.value} onPress={() => setCondition(c.value)} />
            ))}
          </View>

          <Button title="Publish listing" onPress={onSubmit} loading={submitting} disabled={!canSubmit} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
