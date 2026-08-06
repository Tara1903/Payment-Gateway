import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { HeartbeatSchema } from '@starpay/shared';

export async function GET(request: NextRequest) {
  const deviceId = request.headers.get('X-Device-ID');
  const deviceApiKey = request.headers.get('X-Device-API-Key');

  // Validate device API key
  if (!deviceApiKey || deviceApiKey !== process.env.ANDROID_DEVICE_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid device API key' } },
      { status: 401 }
    );
  }

  if (!deviceId) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'X-Device-ID header required' } },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Update device last heartbeat
  const { error } = await supabase
    .from('android_devices')
    .update({
      last_heartbeat: new Date().toISOString(),
    })
    .eq('device_id', deviceId)
    .eq('is_active', true);

  if (error) {
    console.error('[Health] Failed to update heartbeat:', error.message);
  }

  return NextResponse.json({
    success: true,
    data: { status: 'ok', serverTime: new Date().toISOString() },
  });
}

export async function POST(request: NextRequest) {
  const deviceId = request.headers.get('X-Device-ID');
  const deviceApiKey = request.headers.get('X-Device-API-Key');

  if (!deviceApiKey || deviceApiKey !== process.env.ANDROID_DEVICE_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid device API key' } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = HeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { batteryLevel, appVersion, queueDepth } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('android_devices')
    .update({
      last_heartbeat: new Date().toISOString(),
      battery_level: batteryLevel,
      app_version: appVersion,
      queue_depth: queueDepth,
    })
    .eq('device_id', deviceId ?? parsed.data.deviceId)
    .eq('is_active', true);

  if (error) {
    console.error('[Health] Failed to update heartbeat:', error.message);
  }

  return NextResponse.json({
    success: true,
    data: { status: 'ok', serverTime: new Date().toISOString() },
  });
}
