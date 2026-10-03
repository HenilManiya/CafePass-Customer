import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Side = 'left' | 'right';

interface Props {
  targetSlotIndex: number; // 0 to 9
  onComplete: () => void;
  onStamp?: () => void;
  targetSlotPosition?: { x: number; y: number };
  /** Which screen edge he walks in from. Default: random. */
  enterFrom?: Side | 'random';
  /** Where he leaves. 'same' keeps walking the same way, 'opposite' turns back. Default: random. */
  exitTo?: Side | 'same' | 'opposite' | 'random';
  /** Walking speed in px/s. Default 170 (brisk walk). */
  walkSpeed?: number;
}

type AV = { value: number };

const PI = Math.PI;
const RAD = PI / 180;
const SCALE = 0.65; // character is drawn in a 200x300 box, shown at 65%
const LEG_LEN = 98; // hip -> ground (box units)
const SWING = 30; // max thigh swing (deg)
// Distance covered by one full gait cycle (2 steps) so feet do not slide on the ground
const STRIDE_PX = 4 * LEG_LEN * Math.sin((SWING * PI) / 180) * SCALE;

/* ---- Stamping geometry (all in the 200x300 character box) ---- */
const HIP_Y = 165; // upper body leans about (100, 165)
const SH_Y = 90; // shoulder joint (x = 100)
const L1 = 40; // upper arm: shoulder -> elbow
const L2 = 32; // forearm: elbow -> wrist
const STAMP_LEN = 36; // wrist -> bottom of the ink pad
const REACH_BOX = 54; // how far in front of the body (x = 100) the stamp lands
const SURF_Y = 174; // height of the card surface
const PRESS = 2; // pad sinks slightly into the card on impact
const TIP_X = 100 + REACH_BOX;
const STAMP_REACH_PX = REACH_BOX * SCALE; // used to position him beside the slot

const OFF_LEFT = -220;
const OFF_RIGHT = width + 140;

/* ---- Stamp timeline (ms, relative to T0) ---- */
const T_WIND = 260; // raise stamp straight above the slot
const T_ANTI = 90; // tiny pause + pull back (anticipation)
const T_SLAM = 85; // fast vertical drop
const T_PRESS = 230; // hold pressed on the card
const T_LIFT = 220; // lift straight up
const T_RET = 340; // arm swings back to his side

/* ------------------------------------------------------------------ */
/*  Arm IK: finds shoulder + elbow angles so the stamp pad is exactly  */
/*  at (tipX, tipY) and always held perfectly vertical.                */
/* ------------------------------------------------------------------ */

function solveArm(tipX: number, tipY: number, leanDeg: number) {
  'worklet';
  const l = leanDeg * RAD;
  // Shoulder position after the torso leans about the hips
  const sx = 100 + (HIP_Y - SH_Y) * Math.sin(l);
  const sy = HIP_Y - (HIP_Y - SH_Y) * Math.cos(l);
  // Wrist target (pad is vertical, so the wrist is STAMP_LEN above the tip)
  let dx = tipX - sx;
  let dy = tipY - STAMP_LEN - sy;
  const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
  const dc = Math.min(L1 + L2 - 0.5, Math.max(12, d));
  dx *= dc / d;
  dy *= dc / d;

  const phi = Math.atan2(-dx, dy); // direction shoulder -> wrist (0 = straight down, negative = forward)
  const cosB = (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc);
  const beta = Math.acos(Math.min(1, Math.max(-1, cosB)));
  const phi1 = phi + beta; // elbow always bends down/back (natural)
  const ex = -L1 * Math.sin(phi1);
  const ey = L1 * Math.cos(phi1);
  const phi2 = Math.atan2(-(dx - ex), dy - ey);

  let el = phi2 - phi1;
  if (el > PI) el -= 2 * PI;
  if (el < -PI) el += 2 * PI;
  return { sh: phi1 / RAD - leanDeg, el: el / RAD };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Rotates a part around a real joint (px, py are inside the part's own box). */
function Pivot({
  w,
  h,
  left,
  top,
  px,
  py,
  angle,
  children,
}: {
  w: number;
  h: number;
  left: number;
  top: number;
  px: number;
  py: number;
  angle: AV;
  children?: React.ReactNode;
}) {
  const dx = px - w / 2;
  const dy = py - h / 2;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx },
      { translateY: dy },
      { rotate: `${angle.value}deg` },
      { translateX: -dx },
      { translateY: -dy },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: w, height: h }, style]}>
      {children}
    </Animated.View>
  );
}

/** Constant-speed walk with a soft start and (optionally) a soft stop. Returns animation + duration (ms). */
function walkAnim(from: number, to: number, v: number, softStop: boolean) {
  const dir = to >= from ? 1 : -1;
  const d = Math.abs(to - from);
  const acc = Math.min(40, d / 3);
  const dec = softStop ? Math.min(60, d / 3) : 0;
  const cruise = Math.max(0, d - acc - dec);
  const steps = [
    withTiming(from + dir * acc, { duration: ((2 * acc) / v) * 1000, easing: Easing.in(Easing.quad) }),
    withTiming(from + dir * (acc + cruise), { duration: (cruise / v) * 1000, easing: Easing.linear }),
  ];
  if (dec > 0) {
    steps.push(withTiming(to, { duration: ((2 * dec) / v) * 1000, easing: Easing.out(Easing.quad) }));
  }
  const duration = ((2 * acc + cruise + 2 * dec) / v) * 1000;
  return { anim: withSequence(...steps), duration };
}

/** Small ink droplet that flies out of the stamp impact. */
function Drop({ ring, ang, dist }: { ring: AV; ang: number; dist: number }) {
  const style = useAnimatedStyle(() => {
    const r = ring.value;
    return {
      opacity: r > 0 && r < 1 ? 0.9 * (1 - r) : 0,
      transform: [
        { translateX: Math.cos(ang) * dist * r },
        { translateY: -Math.abs(Math.sin(ang)) * dist * r + 16 * r * r },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: TIP_X - 2.5,
          top: SURF_Y - 2.5,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: '#B71C1C',
        },
        style,
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Body parts (character faces RIGHT; the whole figure is mirrored    */
/*  with scaleX when he walks left)                                    */
/* ------------------------------------------------------------------ */

function Leg({ thigh, knee, foot, far }: { thigh: AV; knee: AV; foot: AV; far?: boolean }) {
  const pants = far ? '#121a22' : '#1c2833';
  const shoe = far ? '#2a1a16' : '#3E2723';
  return (
    <Pivot w={28} h={52} left={86} top={152} px={14} py={8} angle={thigh}>
      <Svg width={28} height={52} viewBox="0 0 28 52">
        <Rect x={3} y={0} width={22} height={50} rx={10} fill={pants} />
      </Svg>
      <Pivot w={28} h={56} left={0} top={44} px={14} py={8} angle={knee}>
        <Svg width={28} height={56} viewBox="0 0 28 56">
          <Rect x={5} y={0} width={18} height={50} rx={8} fill={pants} />
        </Svg>
        <Pivot w={46} h={22} left={0} top={40} px={14} py={6} angle={foot}>
          <Svg width={46} height={22} viewBox="0 0 46 22">
            <Path d="M 6 4 L 22 4 L 30 12 Q 44 13 44 19 L 44 22 L 6 22 Q 3 12 6 4 Z" fill={shoe} />
          </Svg>
        </Pivot>
      </Pivot>
    </Pivot>
  );
}

function Arm({
  shoulder,
  elbow,
  stampAngle,
  far,
}: {
  shoulder: AV;
  elbow: AV;
  stampAngle?: AV; // when given, this hand holds the stamp (kept pointing down)
  far?: boolean;
}) {
  const sleeve = far ? '#EDE6E0' : '#FFFFFF';
  const sleeveLine = far ? '#D5CAC2' : '#E3D9D2';
  const skin = far ? '#EBB89A' : '#FFCDB2';
  return (
    <Pivot w={30} h={56} left={85} top={80} px={15} py={10} angle={shoulder}>
      <Svg width={30} height={56} viewBox="0 0 30 56">
        <Rect x={5} y={0} width={20} height={54} rx={10} fill={sleeve} stroke={sleeveLine} strokeWidth={1.5} />
      </Svg>
      <Pivot w={30} h={48} left={0} top={44} px={15} py={6} angle={elbow}>
        <Svg width={30} height={48} viewBox="0 0 30 48">
          <Rect x={9} y={0} width={12} height={36} rx={6} fill={skin} />
          {!stampAngle && <Circle cx={15} cy={38} r={8} fill={skin} />}
        </Svg>
        {stampAngle && (
          <Pivot w={30} h={46} left={0} top={30} px={15} py={8} angle={stampAngle}>
            <Svg width={30} height={46} viewBox="0 0 30 46">
              <Rect x={12} y={12} width={6} height={20} rx={2} fill="#3E2723" />
              <Rect x={3} y={30} width={24} height={11} rx={3} fill="#795548" />
              <Rect x={5} y={40} width={20} height={4} rx={2} fill="#B71C1C" />
              <Circle cx={15} cy={8} r={8} fill={skin} />
            </Svg>
          </Pivot>
        )}
      </Pivot>
    </Pivot>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AnimatedBarista({
  targetSlotIndex,
  onComplete,
  onStamp,
  targetSlotPosition,
  enterFrom = 'random',
  exitTo = 'random',
  walkSpeed = 170,
}: Props) {
  const onStampRef = useRef(onStamp);
  const onCompleteRef = useRef(onComplete);
  onStampRef.current = onStamp;
  onCompleteRef.current = onComplete;

  // Decide (once) where he comes from and where he leaves: dir +1 = moving right, -1 = moving left
  const cfg = useRef<{ enterDir: 1 | -1; exitDir: 1 | -1 } | null>(null);
  if (!cfg.current) {
    const enterDir: 1 | -1 =
      enterFrom === 'left' ? 1 : enterFrom === 'right' ? -1 : Math.random() < 0.5 ? 1 : -1;
    let exitDir: 1 | -1;
    if (exitTo === 'left') exitDir = -1;
    else if (exitTo === 'right') exitDir = 1;
    else if (exitTo === 'same') exitDir = enterDir;
    else if (exitTo === 'opposite') exitDir = enterDir === 1 ? -1 : 1;
    else exitDir = Math.random() < 0.5 ? 1 : -1;
    cfg.current = { enterDir, exitDir };
  }
  const { enterDir, exitDir } = cfg.current;

  // Target slot on the 5x2 grid
  const row = Math.floor(targetSlotIndex / 5);
  const col = targetSlotIndex % 5;
  
  // Calculate center of the slot relative to the punch card
  // Card has 16 margin on screen edges, 20 padding (p-5), 4 padding (px-1)
  const cardPadding = 24; 
  const innerWidth = width - 80;
  const slotWidth = innerWidth / 5;
  const fallbackSlotX = cardPadding + (col * slotWidth) + (slotWidth / 2);
  const slotDiameter = slotWidth * 0.8;
  const headerOffset = 90; // Top padding (20) + header (~70)
  const fallbackSlotY = headerOffset + (row * (slotDiameter + 16)) + (slotDiameter / 2);

  const slotCenterX = targetSlotPosition?.x ?? fallbackSlotX;
  const slotCenterY = targetSlotPosition?.y ?? fallbackSlotY;

  // Stamping alignment:
  // Balanced (+12) so the stamp lands dead center in the punch hole
  const standX = enterDir === 1 ? (slotCenterX - 95.1) : (slotCenterX - 24.9);
  const targetY = slotCenterY - 20;

  const startX = enterDir === 1 ? OFF_LEFT : OFF_RIGHT;
  const endX = exitDir === 1 ? OFF_RIGHT : OFF_LEFT;

  /* ---------------- shared values ---------------- */
  const x = useSharedValue(startX);
  const face = useSharedValue<number>(enterDir); // +1 faces right, -1 faces left
  const exiting = useSharedValue(0);
  const walk = useSharedValue(1); // gait amplitude 0..1
  const ik = useSharedValue(0); // 0 = arm follows the walk swing, 1 = arm is placed by IK on the stamp target
  const tipX = useSharedValue(112); // stamp pad target (box units)
  const tipY = useSharedValue(190);
  const leanA = useSharedValue(0); // stamping lean (deg): back on wind-up, forward on the slam
  const impact = useSharedValue(0);
  const ring = useSharedValue(0);
  const hop = useSharedValue(0);
  const blink = useSharedValue(1);
  const breath = useSharedValue(0);

  useEffect(() => {
    const v = walkSpeed;

    // --- timeline (ms) ---
    const inWalk = walkAnim(startX, standX, v, true);
    const outWalk = walkAnim(standX, endX, v, false);
    const T0 = inWalk.duration + 100; // arrives, settles, starts stamping
    const tHit = T0 + T_WIND + T_ANTI + T_SLAM; // pad touches the card
    const tRest = T0 + T_WIND + T_ANTI + T_SLAM + T_PRESS + T_LIFT + T_RET; // arm back at his side
    const tExit = tRest + 25; // starts walking away
    const tDone = tExit + outWalk.duration + 80;

    // Position: walk in -> stand -> walk out
    x.value = withSequence(inWalk.anim, withDelay(tExit - inWalk.duration, outWalk.anim));

    // Gait amplitude: full while travelling, relaxed while standing
    walk.value = withSequence(
      withDelay(Math.max(0, inWalk.duration - 160), withTiming(0, { duration: 160 })),
      withDelay(Math.max(0, tExit - inWalk.duration), withTiming(1, { duration: 150 })),
    );
    exiting.value = withDelay(tRest, withTiming(1, { duration: 1 }));

    // Turn around if leaving the other way (while the arm comes back down)
    if (exitDir !== enterDir) {
      face.value = withDelay(T0 + 950, withTiming(exitDir, { duration: 240, easing: Easing.inOut(Easing.quad) }));
    }

    // IK blend: arm leaves the walk swing, holds the stamp target, then returns to his side
    ik.value = withDelay(
      T0,
      withSequence(
        withTiming(1, { duration: T_WIND, easing: Easing.out(Easing.cubic) }),
        withDelay(T_ANTI + T_SLAM + T_PRESS + T_LIFT, withTiming(0, { duration: T_RET, easing: Easing.inOut(Easing.cubic) })),
      ),
    );

    // Stamp pad path: rise above the slot -> pull back a hair -> straight vertical drop -> press -> straight lift
    tipX.value = withDelay(
      T0,
      withSequence(
        withTiming(TIP_X, { duration: T_WIND, easing: Easing.out(Easing.cubic) }),
        withTiming(TIP_X - 8, { duration: T_ANTI, easing: Easing.out(Easing.quad) }),
        withTiming(TIP_X, { duration: T_SLAM, easing: Easing.in(Easing.quad) }),
      ),
    );
    tipY.value = withDelay(
      T0,
      withSequence(
        withTiming(SURF_Y - 66, { duration: T_WIND, easing: Easing.out(Easing.cubic) }),
        withTiming(SURF_Y - 80, { duration: T_ANTI, easing: Easing.out(Easing.quad) }),
        withTiming(SURF_Y + PRESS, { duration: T_SLAM, easing: Easing.in(Easing.cubic) }),
        withDelay(T_PRESS, withTiming(SURF_Y - 34, { duration: T_LIFT, easing: Easing.out(Easing.cubic) })),
      ),
    );

    // Body weight: lean back on wind-up, throw weight forward into the slam, ease back
    leanA.value = withDelay(
      T0,
      withSequence(
        withTiming(-5, { duration: T_WIND, easing: Easing.out(Easing.cubic) }),
        withTiming(-7, { duration: T_ANTI }),
        withTiming(6, { duration: T_SLAM, easing: Easing.in(Easing.quad) }),
        withDelay(T_PRESS, withTiming(0, { duration: T_LIFT + T_RET, easing: Easing.inOut(Easing.cubic) })),
      ),
    );

    // Impact squash + ink splash + little hop of satisfaction
    impact.value = withDelay(
      tHit,
      withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) })),
    );
    ring.value = withDelay(tHit, withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));
    hop.value = withDelay(
      T0 + 800,
      withSequence(
        withTiming(-8, { duration: 130, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 130, easing: Easing.in(Easing.quad) }),
      ),
    );

    // Idle life
    blink.value = withRepeat(
      withSequence(withDelay(1100, withTiming(0.1, { duration: 70 })), withTiming(1, { duration: 90 })),
      -1,
      false,
    );
    breath.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);

    const hitTimer = setTimeout(() => onStampRef.current?.(), tHit);
    const doneTimer = setTimeout(() => onCompleteRef.current?.(), tDone);

    return () => {
      clearTimeout(hitTimer);
      clearTimeout(doneTimer);
      [x, face, exiting, walk, ik, tipX, tipY, leanA, impact, ring, hop, blink, breath].forEach(cancelAnimation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- gait: driven by DISTANCE walked, so feet never slide ---------------- */
  const theta = useDerivedValue(() => {
    const d = exiting.value > 0.5 ? exitDir : enterDir;
    return ((x.value * d) / STRIDE_PX) * 2 * PI;
  });

  // Near leg (phase = theta) and far leg (phase = theta + PI)
  const thighN = useDerivedValue(() => walk.value * (-SWING * Math.sin(theta.value)) + (1 - walk.value) * -3);
  const kneeN = useDerivedValue(
    () => walk.value * (6 + 42 * Math.pow(Math.max(0, Math.cos(theta.value)), 1.5)) + (1 - walk.value) * 3,
  );
  const footN = useDerivedValue(() => -0.75 * (thighN.value + kneeN.value));

  const thighF = useDerivedValue(() => walk.value * (SWING * Math.sin(theta.value)) + (1 - walk.value) * 6);
  const kneeF = useDerivedValue(
    () => walk.value * (6 + 42 * Math.pow(Math.max(0, -Math.cos(theta.value)), 1.5)) + (1 - walk.value) * 3,
  );
  const footF = useDerivedValue(() => -0.75 * (thighF.value + kneeF.value));

  // Torso lean (about the hips): forward while walking + stamping lean
  const lean = useDerivedValue(() => 3 * walk.value + leanA.value);

  // Stamp arm: IK solution for the current pad target (the body drops 4 units on impact, so compensate)
  const arm = useDerivedValue(() => solveArm(tipX.value, tipY.value - 4 * impact.value, lean.value));

  // Near arm = walk swing blended into the IK pose
  const shoulderN = useDerivedValue(
    () => (1 - ik.value) * (walk.value * 22 * Math.sin(theta.value)) + ik.value * arm.value.sh,
  );
  const elbowN = useDerivedValue(
    () =>
      (1 - ik.value) *
      (walk.value * -(10 + 22 * Math.max(0, -Math.sin(theta.value))) + (1 - walk.value) * -8) +
      ik.value * arm.value.el,
  );
  // Far arm swings opposite
  const shoulderF = useDerivedValue(() => walk.value * -22 * Math.sin(theta.value) + (1 - walk.value) * 2);
  const elbowF = useDerivedValue(
    () => walk.value * -(10 + 22 * Math.max(0, Math.sin(theta.value))) + (1 - walk.value) * -8,
  );

  // Stamp pad is exactly flat/vertical while stamping (ik = 1), relaxed while walking
  const stampAngle = useDerivedValue(
    () => -(shoulderN.value + elbowN.value) * (0.92 + 0.08 * ik.value) - lean.value,
  );
  // Head follows the stamp: looks down at it on the slam
  const headAngle = useDerivedValue(
    () => 2 * Math.sin(2 * theta.value) * walk.value + 6 * impact.value + 0.5 * leanA.value,
  );

  /* ---------------- animated styles ---------------- */
  const travelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: targetY }],
  }));

  const faceStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: face.value }] }));

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 9 * Math.abs(Math.sin(theta.value)) * walk.value + 4 * impact.value + hop.value }],
  }));

  const squashStyle = useAnimatedStyle(() => {
    const sy = 1 - 0.03 * impact.value + 0.012 * breath.value * (1 - walk.value);
    return { transform: [{ translateY: 15 }, { scaleY: sy }, { translateY: -15 }] };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const air = -hop.value;
    return { transform: [{ scaleX: 1 - air * 0.015 }], opacity: 0.2 - air * 0.006 };
  });

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value * (1 - 0.75 * impact.value) }],
  }));

  // Ink ring spreading from the stamp
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value > 0 && ring.value < 1 ? 0.85 * (1 - ring.value) : 0,
    transform: [{ scale: 0.4 + 1.1 * ring.value }],
  }));

  // Solid ink flash on the exact moment of contact
  const flashStyle = useAnimatedStyle(() => ({
    opacity: 0.65 * impact.value,
    transform: [{ scaleX: 1 + 0.25 * (1 - impact.value) }],
  }));

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
      pointerEvents="none"
    >
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, travelStyle]}>
        <View style={{ transform: [{ scale: SCALE }], marginLeft: -40, marginTop: -150 }}>
          <Animated.View style={[{ width: 200, height: 300 }, faceStyle]}>
            {/* Ground shadow */}
            <Animated.View
              style={[
                { position: 'absolute', left: 38, top: 251, width: 124, height: 16, borderRadius: 8, backgroundColor: '#000' },
                shadowStyle,
              ]}
            />

            {/* Stamp impact on the card: solid flash, ink ring, droplets */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: TIP_X - 11,
                  top: SURF_Y - 3,
                  width: 22,
                  height: 6,
                  borderRadius: 11,
                  backgroundColor: '#B71C1C',
                },
                flashStyle,
              ]}
            />
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: TIP_X - 25,
                  top: SURF_Y - 7,
                  width: 50,
                  height: 14,
                  borderRadius: 25,
                  borderWidth: 3,
                  borderColor: '#B71C1C',
                },
                ringStyle,
              ]}
            />
            {[0.15, 0.35, 0.5, 0.65, 0.85].map((a, i) => (
              <Drop key={i} ring={ring} ang={a * PI} dist={16 + (i % 2) * 8} />
            ))}

            <Animated.View style={[{ position: 'absolute', width: 200, height: 300 }, bobStyle]}>
              {/* Legs (far one first so the near one overlaps it) */}
              <Leg far thigh={thighF} knee={kneeF} foot={footF} />
              <Leg thigh={thighN} knee={kneeN} foot={footN} />

              {/* Upper body */}
              <Pivot w={200} h={300} left={0} top={0} px={100} py={165} angle={lean}>
                <Animated.View style={[{ position: 'absolute', width: 200, height: 300 }, squashStyle]}>
                  {/* Far arm (behind torso) */}
                  <Arm far shoulder={shoulderF} elbow={elbowF} />

                  {/* Torso in profile */}
                  <Svg width="100%" height="100%" viewBox="0 0 200 300" style={{ position: 'absolute' }}>
                    <Rect x="94" y="62" width="13" height="18" fill="#FFCDB2" />
                    <Rect x="82" y="76" width="38" height="96" rx="14" fill="#FFFFFF" stroke="#E3D9D2" strokeWidth="1.5" />
                    <Path d="M 100 84 L 122 84 L 123 176 L 96 176 Z" fill="#5D4037" />
                    <Path d="M 104 84 L 100 66" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                    <Rect x="82" y="114" width="40" height="6" fill="#4E342E" />
                    <Rect x="103" y="132" width="16" height="24" rx="4" fill="#4E342E" />
                  </Svg>

                  {/* Head in profile (nose to the right) */}
                  <Pivot w={200} h={100} left={0} top={0} px={100} py={68} angle={headAngle}>
                    <Svg width={200} height={100} viewBox="0 0 200 100" style={{ position: 'absolute' }}>
                      <Circle cx="104" cy="42" r="27" fill="#FFCDB2" />
                      <Path d="M 128 38 Q 140 45 129 51 Z" fill="#FFCDB2" />
                      <Circle cx="97" cy="46" r="5" fill="#F0B99B" />
                      <Path
                        d="M 76 46 Q 70 14 104 14 Q 130 16 131 34 Q 112 22 94 27 Q 82 32 84 52 Q 76 56 76 46 Z"
                        fill="#3E2723"
                      />
                      <Path d="M 111 31 L 122 30" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
                      <Path
                        d="M 114 57 Q 121 62 128 55"
                        stroke="#3E2723"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <Circle cx="112" cy="52" r="4" fill="#FF8A65" opacity="0.5" />
                      <Path d="M 76 26 Q 104 0 130 22 L 142 26 L 74 30 Z" fill="#4E342E" />
                      <Path d="M 74 30 Q 108 34 142 26" stroke="#3E2723" strokeWidth="2" fill="none" />
                    </Svg>
                    <Animated.View
                      style={[
                        { position: 'absolute', left: 112, top: 34, width: 7, height: 9, borderRadius: 4, backgroundColor: '#3E2723' },
                        eyeStyle,
                      ]}
                    />
                  </Pivot>

                  {/* Near arm with the stamp (in front of everything) */}
                  <Arm shoulder={shoulderN} elbow={elbowN} stampAngle={stampAngle} />
                </Animated.View>
              </Pivot>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}