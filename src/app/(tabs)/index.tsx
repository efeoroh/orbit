import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Glow, GlowHandle } from '../../components/Glow';
import { HoldCircle } from '../../components/HoldCircle';
import { QuickLog } from '../../components/QuickLog';
import { Button, Screen, Segmented, T } from '../../components/ui';
import { addDays, dateKey, fromKey } from '../../lib/dates';
import { celebrate, levelUp, tap } from '../../lib/feedback';
import { checkInSteps, isDone } from '../../lib/habits';
import { levelUpIfEarned, setCheck, setWater, useOrbit } from '../../lib/store';
import { colors, groupColor, groupName, type Group } from '../../lib/theme';
import { useToday } from '../../lib/useToday';

export default function CheckIn() {
  const { settings, days } = useOrbit();
  const [which, setWhich] = useState<'yesterday' | 'today'>('today');
  const today = useToday();
  const date = useMemo(() => addDays(fromKey(today), which === 'today' ? 0 : -1), [which, today]);
  const key = dateKey(date);
  const day = days[key];
  const steps = checkInSteps(settings);
  const glow = useRef<GlowHandle>(null);
  const enter = useRef(new Animated.Value(1)).current;
  const [toast, setToast] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = (msg: string) => {
    setToast(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const answered = (i: number) => {
    const h = steps[i];
    if (!h) return true;
    if (h.kind === 'water') return (day?.water ?? 0) >= settings.waterGoal || day?.checks.water !== undefined;
    return day?.checks[h.id] !== undefined;
  };
  const firstOpen = () => {
    const i = steps.findIndex((_, k) => !answered(k));
    return i === -1 ? steps.length : i;
  };
  const [step, setStep] = useState(firstOpen);
  useEffect(() => setStep(firstOpen()), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const finished = step >= steps.length;
  const cur = steps[Math.min(step, steps.length - 1)];

  function go(next: number) {
    enter.setValue(0);
    setStep(next);
    Animated.timing(enter, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }

  const onCelebrate = (g: Group) => {
    celebrate(g);
    glow.current?.flash(groupColor[g]);
  };

  function done() {
    if (!cur) return;
    if (cur.kind === 'water') setWater(key, Math.max(settings.waterGoal, day?.water ?? 0));
    else setCheck(key, cur.id, true);
    const lv = levelUpIfEarned(cur.id, key);
    if (lv) {
      levelUp();
      glow.current?.flash(groupColor[cur.group]);
      showToast(`Level up! ${lv.name} is now ${lv.target}`);
    } else onCelebrate(cur.group);
    setTimeout(() => go(step + 1), 420);
  }

  function missed() {
    if (!cur) return;
    setCheck(key, cur.id, false);
    go(step + 1);
  }

  const doneCount = steps.filter((h) => isDone(h, day, settings)).length;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 14, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
            <Pressable
              onPress={() => {
                tap();
                go(Math.max(0, step - 1));
              }}
              disabled={step === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous habit"
              style={{ width: 44, height: 44, justifyContent: 'center', opacity: step === 0 ? 0.3 : 1 }}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path d="M15 5l-7 7 7 7" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
              <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden>
                {steps.map((h, i) => {
                  const v = h.kind === 'water' ? ((day?.water ?? 0) >= settings.waterGoal ? true : day?.checks.water) : day?.checks[h.id];
                  return (
                    <View
                      key={h.id}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: i === step ? colors.ink : v === true ? groupColor[h.group] : v === false ? colors.border : colors.dotOff,
                      }}
                    />
                  );
                })}
              </View>
              <T size={12} color={colors.muted}>
                {finished ? 'All done' : `${step + 1} of ${steps.length}`}
              </T>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <Segmented
            label="Which day"
            style={{ alignSelf: 'center', width: 220 }}
            value={which}
            onChange={setWhich}
            options={[
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'today', label: 'Today' },
            ]}
          />

          <QuickLog dayKey={key} date={date} day={day} settings={settings} onCelebrate={onCelebrate} />

          {!finished && cur ? (
            <Animated.View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
                paddingTop: 6,
                opacity: enter,
                transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              }}
            >
              <View style={{ alignItems: 'center', gap: 4 }} accessibilityLiveRegion="polite">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: groupColor[cur.group] }} />
                  <T w="semibold" size={12} color={colors.muted} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {groupName[cur.group]}
                  </T>
                </View>
                <T w="display" size={34} style={{ textAlign: 'center' }}>
                  {cur.name}
                </T>
                <T size={15} color={colors.muted} style={{ textAlign: 'center' }}>
                  {cur.prompt}
                </T>
              </View>
              <HoldCircle key={`${key}-${cur.id}`} size={206} color={groupColor[cur.group]} label={`${cur.name}. ${cur.prompt}`} onComplete={done} />
              <Button label="Missed · next" kind="outline" onPress={missed} style={{ minWidth: 200, minHeight: 48 }} />
            </Animated.View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 }}>
              <T w="display" size={30}>
                All checked in
              </T>
              <T size={15} color={colors.muted} style={{ textAlign: 'center' }}>
                {doneCount} of {steps.length} done{which === 'yesterday' ? ' yesterday' : ' today'}
              </T>
              <Button label={which === 'today' ? "See today's rings" : 'See progress'} onPress={() => router.navigate(which === 'today' ? '/rings' : '/progress')} style={{ minWidth: 220, marginTop: 12 }} />
              <Button label="Start over" kind="text" onPress={() => go(0)} />
            </View>
          )}
        </ScrollView>
      </Screen>
      <Glow ref={glow} />
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="assertive"
          style={{
            position: 'absolute',
            top: 64,
            left: 24,
            right: 24,
            zIndex: 30,
            alignItems: 'center',
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
          }}
        >
          <View style={{ backgroundColor: colors.dark, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18 }}>
            <T w="semibold" size={15} color={colors.onDark} style={{ textAlign: 'center' }}>
              {toast}
            </T>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
