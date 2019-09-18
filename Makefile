# Variables

libdir = /qsys.lib/$(LIB).lib

PGMS = $(libdir)/HELLO.PGM

rootdir = $(shell pwd)

sshhost = eradani-lpar-root

ifndef LIB
	$(error Please define the LIB environment variable and try again)
endif

# Rules

all: $(PGMS)

# Programs

$(libdir)/HELLO.PGM: hello.rpgle
	system "CHGATR OBJ('$(rootdir)/hello.rpgle') ATR(*CCSID) VALUE(819)"
	system "CRTBNDRPG PGM($(LIB)/HELLO) SRCSTMF('$<')"

.PHONY: init
init:
	-system "CRTLIB $(LIB)"

.PHONY: clean
clean:
	-system "DLTPGM PGM($(LIB)/HELLO)"
