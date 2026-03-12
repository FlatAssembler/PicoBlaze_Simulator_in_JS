.intel_syntax noprefix

.section .data
searching_for_solutions_string: .asciz "Searching for solutions...\n"
current_attempt_is_string:     .asciz "The current attempt is: "
found_a_solution_string:       .asciz "Found a solution: "
thats_the_solution_string:     .asciz "That's the solution #"
the_end_string:                .asciz "The end!\n"
empty_message_string:          .asciz "Empty"

# Variables (allocate space)
NDEBUG:                 .long 1
should_we_print_chessboards: .long 1
size_of_the_chessboard: .long 8
address_of_the_current_attempt: .long 0
digits_of_the_ordinal_number: .long 10
bottom_of_the_stack: .long 16
maximal_length_of_the_output: .long 30000

string_to_be_printed: .long 0
top_of_the_stack: .long 0
regbank_b_s0: .long 0
regbank_b_s1: .long 0
regbank_b_s2: .long 0
length_of_the_current_attempt: .long 0
s0: .long 0
s1: .long 0
s2: .long 0
s3: .long 0
s6: .long 0
s7: .long 0
s8: .long 0
s9: .long 0
sb: .long 0

linear_memory: .space 1024   # Or whatever size the program requires

.section .text
.global _start

_start:
    mov eax, offset searching_for_solutions_string
    mov [string_to_be_printed], eax
    call print_string
    
    # Reset ordinal numbers loop
    mov eax, digits_of_the_ordinal_number
    mov [regbank_b_s0], eax
    mov [regbank_b_s2], eax
reset_ordinal_numbers_loop:
    mov eax, [regbank_b_s0]
    cmp eax, bottom_of_the_stack
    jnc end_of_the_reset_ordinal_numbers_loop
    mov ebx, '0'
    mov [regbank_b_s1], ebx
    call store_macro
    add eax, 1
    mov [regbank_b_s0], eax
    jmp reset_ordinal_numbers_loop
end_of_the_reset_ordinal_numbers_loop:

    mov eax, bottom_of_the_stack
    mov [top_of_the_stack], eax
    mov [s0], 0
    call store_macro
    mov eax, [top_of_the_stack]
    add eax, size_of_the_chessboard
    add eax, 1
    mov [top_of_the_stack], eax

main_loop:
    mov eax, [top_of_the_stack]
    cmp eax, bottom_of_the_stack
    jz end_of_the_main_loop
    sub eax, size_of_the_chessboard
    sub eax, 1
    mov [top_of_the_stack], eax

    call fetch_macro
    mov eax, address_of_the_current_attempt
    mov [s0], eax
    call store_macro
    mov eax, [top_of_the_stack]
    mov [s1], eax
    mov [s2], 0

copying_the_current_attempt_from_the_stack_loop:
    mov eax, [length_of_the_current_attempt]
    cmp [s2], eax
    jz end_of_copying_the_current_attempt_from_the_stack_loop
    add [s2], 1
    add [s0], 1
    add [s1], 1
    call fetch_macro
    call store_macro
    jmp copying_the_current_attempt_from_the_stack_loop
end_of_copying_the_current_attempt_from_the_stack_loop:

    mov eax, NDEBUG
    mov eax, [eax]
    test eax, eax
    jnz dont_print_the_current_attempt

    mov eax, offset current_attempt_is_string
    mov [string_to_be_printed], eax
    call print_string
    call print_the_current_attempt

dont_print_the_current_attempt:
    cmp [length_of_the_current_attempt], size_of_the_chessboard
    jnz not_a_solution

    # ... The rest of your code should be ported similarly ...
    # (Port found_a_solution, print_the_chessboard, ordinal number logic, etc.)

end_of_the_main_loop:
    mov eax, offset the_end_string
    mov [string_to_be_printed], eax
    call print_string

    # Exit routine for Linux
    mov eax, 60     # syscall: exit
    xor edi, edi    # status: 0
    syscall

# Macro implementations can be replaced by local functions
store_macro:
    # Arguments: [regbank_b_s1], [regbank_b_s0]
    movzx ebx, [regbank_b_s0]
    mov al, [regbank_b_s1]
    mov [linear_memory + ebx], al
    ret

fetch_macro:
    # Arguments: destination register in [regbank_b_s1], index in [regbank_b_s0]
    movzx ebx, [regbank_b_s0]
    mov al, [linear_memory + ebx]
    mov [regbank_b_s1], al
    ret

print_string:
    # Arguments: address in [string_to_be_printed]
    # Implement according to OS/platform (e.g., syscall write, or call puts if using MSVCRT/MinGW)
    ret

print_the_current_attempt:
    # Implement similarly
    ret

# ... Continue with further routines ...