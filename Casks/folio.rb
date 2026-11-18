cask "folio" do
  version "1.0.0"
  sha256 "3f8fa6c3862b764edc71429000e7412f5993c8059add2006ec3f49dabcc2fca2"

  url "https://github.com/MODUGGAGI/homebrew-folio/releases/download/v#{version}/Folio.zip"
  name "Folio"
  desc "Local library for resumes, portfolios and job applications"
  homepage "https://github.com/MODUGGAGI/homebrew-folio"

  auto_updates true
  depends_on macos: ">= :tahoe"

  app "Folio.app"
  binary "#{appdir}/Folio.app/Contents/MacOS/folio-mcp"
end
