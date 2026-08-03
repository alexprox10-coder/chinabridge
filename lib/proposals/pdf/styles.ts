import { StyleSheet } from '@react-pdf/renderer';

export const RED = '#dc2626';
export const DARK = '#1e293b';
export const GREY = '#64748b';
export const LIGHT_GREY = '#f1f5f9';
export const WHITE = '#ffffff';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    color: DARK,
    backgroundColor: WHITE,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // Header bar
  headerBar: {
    backgroundColor: RED,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: { fontSize: 16, fontWeight: 'bold', color: WHITE },
  headerDocNum: { fontSize: 8, color: 'rgba(255,255,255,0.8)' },
  // Body
  body: { paddingHorizontal: 40, paddingTop: 24 },
  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: RED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
    paddingBottom: 4,
  },
  // Cover page
  coverPage: {
    backgroundColor: DARK,
  },
  coverHeader: {
    backgroundColor: RED,
    paddingHorizontal: 50,
    paddingTop: 50,
    paddingBottom: 40,
  },
  coverLogoText: { fontSize: 28, fontWeight: 'bold', color: WHITE },
  coverLogoSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  coverBody: {
    paddingHorizontal: 50,
    paddingTop: 50,
    flex: 1,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 40,
  },
  coverMeta: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 20,
    marginBottom: 30,
  },
  coverMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coverMetaLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', width: 120 },
  coverMetaValue: { fontSize: 9, color: WHITE, fontWeight: 'bold', flex: 1 },
  coverClientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginTop: 20,
  },
  coverModeBadge: {
    backgroundColor: RED,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  coverModeBadgeText: { fontSize: 9, fontWeight: 'bold', color: WHITE },
  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoRow: { flexDirection: 'row', marginBottom: 6, width: '50%' },
  infoLabel: { fontSize: 9, color: GREY, width: 90 },
  infoValue: { fontSize: 9, color: DARK, flex: 1, fontWeight: 'bold' },
  // Benefit row
  benefitRow: { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  benefitCheck: { fontSize: 10, color: RED, width: 16, fontWeight: 'bold' },
  benefitText: { fontSize: 10, color: DARK, flex: 1 },
  // Step row
  stepRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  stepNum: {
    fontSize: 9,
    fontWeight: 'bold',
    color: WHITE,
    backgroundColor: RED,
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    paddingTop: 3,
    marginRight: 10,
  },
  stepText: { fontSize: 10, color: DARK, flex: 1, paddingTop: 3 },
  // Assessment box
  assessmentBox: {
    backgroundColor: LIGHT_GREY,
    borderRadius: 6,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  assessmentText: { fontSize: 10, color: GREY },
  assessmentHighlight: { fontSize: 11, fontWeight: 'bold', color: DARK, marginBottom: 6 },
  // Missing fields
  missingItem: { flexDirection: 'row', marginBottom: 4 },
  missingBullet: { fontSize: 10, color: RED, width: 14 },
  missingText: { fontSize: 10, color: DARK, flex: 1 },
  // Description text
  bodyText: { fontSize: 10, color: DARK, lineHeight: 1.6, marginBottom: 8 },
  // Contacts page
  contactsPage: { backgroundColor: DARK, flex: 1 },
  contactsHeader: { backgroundColor: RED, padding: 40, paddingBottom: 30 },
  contactsTitle: { fontSize: 18, fontWeight: 'bold', color: WHITE },
  contactsSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  contactsBody: { padding: 40 },
  contactRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  contactLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', width: 80 },
  contactValue: { fontSize: 11, fontWeight: 'bold', color: WHITE, flex: 1 },
  qrPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: { fontSize: 7, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  footerText: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: GREY,
    textAlign: 'center',
  },
});
