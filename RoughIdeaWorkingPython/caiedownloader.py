# CAIE Downloader
# Author: @itsgeagle
# Modified to use ONLY BestExamHelp + Added Examiner's Report
# -------------------------------

from modules.file_handler import download_paper, compile_pdf, clear_temp_files
from modules.gui import *
from modules.popup_handler import version_popup, message_popup, edit_config
from modules.verification_handler import compare_version, validate_input
from modules.config_handler import init_config

VERSION = 'v1.3.1'


# -------------------------------
# Main method for the program
# -------------------------------
def main():
    if validate_input():
        clear_temp_files()

        subCode = subject_var.get()
        paperCode = paper_var.get()

        # Year conversion
        start = int(start_year.get()) if len(start_year.get()) == 2 else int(start_year.get()[-2:])
        end = int(end_year.get()) if len(end_year.get()) == 2 else int(end_year.get()[-2:])

        # Paper type selection
        pType = paper_type.get()
        if pType == 'Question Papers':
            paperType = 'qp'
        elif pType == 'Mark Schemes':
            paperType = 'ms'
        elif pType == 'Examiner Reports':
            paperType = 'er'
        else:
            paperType = 'qp'

        # Sessions
        fm = feb_march.get()
        mj = may_june.get()
        on = oct_nov.get()

        # Cleanup options
        remove_blanks = True if remove_blank.get() == 'Y' else False
        remove_additionals = True if remove_additional.get() == 'Y' else False
        remove_formulae = True if remove_formula.get() == 'Y' else False

        # Start download loop
        for this_code in paperCode.split(","):
            this_code = this_code.strip()

            print(f'Attempting to fetch all {paperType} with code {this_code}s '
                  f'for the subject code {subCode} for the years 20{start}-{end}')

            for year in range(start, end + 1):

                # -------------------------------------------------
                # Examiner's Report — no paper code needed
                # -------------------------------------------------
                if paperType == 'er':
                    if fm == 'Y' and year > 15:
                        download_paper(subCode, None, year, None, 'm', 'er', source='bestexamhelp')

                    if mj == 'Y':
                        download_paper(subCode, None, year, None, 's', 'er', source='bestexamhelp')

                    if on == 'Y':
                        download_paper(subCode, None, year, None, 'w', 'er', source='bestexamhelp')

                    continue  # skip QP/MS logic completely

                # -------------------------------------------------
                # QP / MS logic
                # -------------------------------------------------
                if fm == 'Y' and year > 15:
                    download_paper(subCode, this_code, year, '2', 'm', paperType, source='bestexamhelp')

                if mj == 'Y':
                    download_paper(subCode, this_code, year, '1', 's', paperType, source='bestexamhelp')
                    download_paper(subCode, this_code, year, '2', 's', paperType, source='bestexamhelp')
                    download_paper(subCode, this_code, year, '3', 's', paperType, source='bestexamhelp')

                if on == 'Y':
                    download_paper(subCode, this_code, year, '1', 'w', paperType, source='bestexamhelp')
                    download_paper(subCode, this_code, year, '2', 'w', paperType, source='bestexamhelp')
                    download_paper(subCode, this_code, year, '3', 'w', paperType, source='bestexamhelp')

        # -------------------------------------------------
        # PDF Compilation
        # -------------------------------------------------
        if not compile_pdf(
            subCode=subCode,
            paperCode=paperCode,
            start=str(start),
            end=str(end),
            delete_blanks=remove_blanks,
            delete_additional=remove_additionals,
            delete_formulae=remove_formulae
        ):
            message_popup("Your query did not end up downloading any valid files. Please try again.", "Error")
        else:
            message_popup("Done processing your request!", "Success")


# -------------------------------
# GUI Buttons
# -------------------------------
Button(root, text='Edit Config', command=edit_config).pack(side=BOTTOM, pady=10)
Button(root, text='Submit', command=main).pack(side=BOTTOM, pady=10)

version_status = compare_version(VERSION)
if not version_status[0]:
    print(version_status[2])
    if version_status[1]:
        version_popup(version_status[1])
    else:
        message_popup(version_status[2], "Error")

init_config()
root.mainloop()
