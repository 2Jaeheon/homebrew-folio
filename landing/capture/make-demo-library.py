"""Builds a demo Folio library for landing page screenshots: a made-up person, real company names and favicons.

Usage: python3 -I landing/capture/make-demo-library.py <home>
Writes <home>/Library/Application Support/Folio/Library. Run the app with CFFIXED_USER_HOME=<home> so it never
reads the real library. Refuses to write into the real home folder.

Documents come from docs/assets/docs/ at the repository root (a fictional person, shared with the landing page). The NAVER WEBTOON posting in
webtoon/ was captured with WebTasks.capture, the same code the app uses for "공고 추가".
"""
import json, os, shutil, sys, uuid

home = os.path.abspath(sys.argv[1])
if home == os.path.expanduser("~"):
    sys.exit("refusing to write into the real home folder")
lib = f"{home}/Library/Application Support/Folio/Library"
if os.path.exists(lib):
    sys.exit(f"{lib} already exists")
here = os.path.dirname(os.path.abspath(__file__))
docs = os.path.join(os.path.dirname(os.path.dirname(here)), "docs", "assets", "docs")


def ts(month, day, hour=10):
    return f"2026-{month:02d}-{day:02d}T{hour:02d}:00:00Z"


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(text)


def document(folder, title, kind, source, dates, origin=None, pick=None):
    """Copies demo-docs/<source>/v1..vN into a document folder as v1..vN. `pick` copies only those source versions."""
    notes = json.load(open(f"{docs}/{source}/notes.json"))
    picked, pick = pick, pick or range(1, len(notes) + 1)
    doc_id = str(uuid.uuid4()).upper()
    versions = []
    for n, (src, date) in enumerate(zip(pick, dates), 1):
        note = "공고에 맞춰 첫 버전" if picked else notes[src - 1]
        shutil.copytree(f"{docs}/{source}/v{src}", f"{folder}/{doc_id}/versions/{n}/content")
        versions.append({"number": n, "note": note, "createdAt": ts(*date), "hasExportPDF": False})
    meta = {"id": doc_id, "title": title, "kind": kind, "format": "html", "createdAt": versions[0]["createdAt"],
            "lastVersionNumber": len(versions), "versions": versions}
    if origin:
        meta["origin"] = origin
    write(f"{folder}/{doc_id}/meta.json", json.dumps(meta, ensure_ascii=False))
    return doc_id


resume = document(f"{lib}/masters", "이력서", "resume", "resume", [(10, 2), (10, 19), (11, 3), (11, 12)])
document(f"{lib}/masters", "포트폴리오", "portfolio", "portfolio", [(10, 5), (10, 28), (11, 10)])
origin = {"masterDocumentID": resume, "versionNumber": 4}

# company, role, status, icon file, career page, created (month, day). Oldest first; the sidebar shows newest on top.
APPS = [  # 네카라배당토, top to bottom under NAVER WEBTOON
    ("토스", "Server Developer", "submitted", "icons/toss.png", "https://toss.im/career", (10, 20)),
    ("당근", "백엔드 엔지니어", "submitted", "icons/daangn.png", "https://about.daangn.com/jobs", (10, 27)),
    ("배달의민족", "백엔드 개발자", "submitted", "icons/baemin.png", "https://career.woowahan.com", (11, 2)),
    ("LINE", "Server Engineer", "preparing", "icons/line.png", "https://careers.linecorp.com", (11, 6)),
    ("카카오", "서버 개발자", "preparing", "icons/kakao.png", "https://careers.kakao.com", (11, 9)),
    ("NAVER", "서버 개발 (신입)", "preparing", "icons/naver.png", "https://recruit.navercorp.com", (11, 13)),
]
for company, role, status, icon, url, created in APPS:
    folder = f"{lib}/applications/{str(uuid.uuid4()).upper()}"
    meta = {"id": os.path.basename(folder), "company": company, "role": role, "jdURL": url, "status": status,
            "createdAt": ts(*created), "hasIcon": True, "hasJDSnapshot": False}
    if status == "submitted":
        meta["submittedAt"] = ts(created[0], created[1] + 3)
    write(f"{folder}/meta.json", json.dumps(meta, ensure_ascii=False))
    write(f"{folder}/jd.txt", f"{company} {role}\n\n(화면 캡처용 예시. 실제 공고 내용이 아닙니다.)")
    shutil.copy(f"{here}/{icon}", f"{folder}/icon.png")
    if company == "당근":  # the landing page shows this one: the NAVER WEBTOON resume in 당근 orange
        document(f"{folder}/documents", "공고용 이력서", "resume", "daangn", [created], origin)
    else:
        document(f"{folder}/documents", "공고용 이력서", "resume", "resume", [created], origin, pick=[4])

folder = f"{lib}/applications/{str(uuid.uuid4()).upper()}"
write(f"{folder}/meta.json", json.dumps({
    "id": os.path.basename(folder), "company": "NAVER WEBTOON",
    "role": "[2027 상반기 채용연계형 인턴십] 네이버웹툰 백엔드 서버 개발",
    "jdURL": "https://recruit.webtoonscorp.com/rcrt/view.do?annoId=30005648", "status": "preparing",
    "createdAt": ts(11, 16), "hasIcon": True, "hasJDSnapshot": True}, ensure_ascii=False))
for name in ["jd.txt", "jd.pdf", "icon.png"]:
    shutil.copy(f"{here}/webtoon/{name}", f"{folder}/{name}")
document(f"{folder}/documents", "공고용 이력서", "resume", "tailored", [(11, 16), (11, 17)], origin)
print(lib)
