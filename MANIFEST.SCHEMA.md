# manifest.json schema

The player loads `/manifest.json`. If that request fails, it loads `manifest.seed.json`. Both files use this schema. `scripts/refresh.sh` rewrites both from the clips on disk.

Times are Asia/Seoul. `versions` is ordered newest mtime first. The default version is `versions[0]`, also stored as `defaultVersionId`.

```json
{
  "generatedAt": "2026-11-19T15:40:00+09:00",
  "title": "국방사업단 홍보영상 — 씬별 재생",
  "timezone": "Asia/Seoul",
  "scenes": [
    {
      "id": "F01",
      "order": 1,
      "title": "F01",
      "part": "오프닝 · 폴리우레아",
      "group": "오프닝",
      "description": "검은 화면에서 폴리우레아가 프레임 밖에서 들어와 화면을 채우고 빠져나간다",
      "camera": "바닥을 향한 정지 구도.",
      "duration": 15,
      "status": "ok",
      "defaultVersionId": "F01-v5-fan-15s--root",
      "versions": [
        {
          "id": "F01-v5-fan-15s--root",
          "label": "루트 · F01-v5-fan-15s · 11.19 14:49",
          "src": "https://bell-kicker.github.io/defense-scene-player-m1/media/F01-v5-fan-15s--root.mp4",
          "poster": "posters/F01-v5-fan-15s--root.jpg",
          "bytes": 10302394,
          "mtime": "2026-11-19T14:49:12+09:00",
          "durationSec": 15.042,
          "width": 1920,
          "height": 1088,
          "videoCodec": "h264",
          "audioCodec": "aac",
          "faststart": true
        }
      ]
    }
  ]
}
```

## Required

| Field | Type | Meaning |
|---|---|---|
| `generatedAt` | string | When this file was written, ISO 8601 with `+09:00`. |
| `title` | string | Page title. |
| `scenes` | array | Storyboard order. |
| `scenes[].id` | string | Scene id, such as `F01`, `F11A-3`, `F11C`. |
| `scenes[].order` | number | 1-based conti order. |
| `scenes[].title` | string | Short title. The player uses the scene id. |
| `scenes[].description` | string | One-line Korean description. |
| `scenes[].duration` | number | Target length in seconds (8 or 15). |
| `scenes[].status` | string | `ok`, `missing`, or `corrupt`. |
| `scenes[].versions` | array | Empty when the scene is not `ok`. |
| `versions[].id` | string | Stable id, unique in the file. |
| `versions[].src` | string | Public `https` URL of an mp4, or a site-relative path. |
| `versions[].poster` | string | JPEG path relative to the site root. |
| `versions[].bytes` | number | File size in bytes. |
| `versions[].mtime` | string | Source file mtime, ISO 8601 `+09:00`. |
| `versions[].label` | string | Text for the version picker. Newest first. |

## Optional

| Field | Meaning |
|---|---|
| `timezone` | Always `Asia/Seoul` when this project writes the file. |
| `scenes[].part`, `group`, `camera` | Conti headings and camera note. |
| `scenes[].defaultVersionId` | Same as `versions[0].id` when status is `ok`. |
| `versions[].durationSec` | Probed length. |
| `versions[].width`, `height` | Probed frame size. |
| `versions[].videoCodec`, `audioCodec` | Expected `h264` and `aac`. |
| `versions[].faststart` | `moov` atom is before `mdat`. |

`src` must not be a loopback address. Missing scenes stay in `scenes` with `status: "missing"` and `versions: []` so the page can show “영상 준비 중” and fill in on the next poll.
